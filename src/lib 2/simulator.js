/**
 * Cache Simulator Logic
 * Ported to React/ES6 Module
 */

export class CacheSimulator {
    constructor(cacheSize, blockSize, associativity, replacementPolicy, powerParams, voltage) {
        this.cacheSize = cacheSize;
        this.blockSize = blockSize;
        this.associativity = associativity === 0 ? cacheSize / blockSize : associativity;
        this.replacementPolicy = replacementPolicy;
        this.powerParams = powerParams;
        this.voltage = voltage;

        this.numBlocks = Math.floor(cacheSize / blockSize);
        this.numSets = Math.floor(this.numBlocks / this.associativity);
        this.offsetBits = Math.log2(blockSize);
        this.indexBits = Math.log2(this.numSets);
        this.tagBits = 32 - this.indexBits - this.offsetBits;

        this.reset();
    }

    reset() {
        this.data = new Array(this.numSets).fill(0).map(() =>
            new Array(this.associativity).fill(null)
        ); // Store data values
        this.symbolTable = {}; // Map variable names to addresses
        this.memory = {}; // Main Memory (RAM) state
        this.nextAllocAddress = 0x1000; // Start allocating vars at 0x1000

        // L2 Cache (Simple Model for now)
        this.l2 = {
            size: 4096, // 4KB
            blockSize: this.blockSize,
            associativity: 4,
            sets: [],
            hits: 0,
            misses: 0
        };
        this.initL2();

        this.cache = Array(this.numSets).fill().map(() =>
            Array(this.associativity).fill().map(() => ({
                valid: false,
                tag: 0,
                accessTime: 0,
                lruCounter: 0,
                dirty: false, // Added dirty bit
                data: null // Added data field
            }))
        );

        this.stats = {
            accesses: 0,
            hits: 0,
            misses: 0,
            compulsoryMisses: 0,
            capacityMisses: 0,
            conflictMisses: 0,
            reads: 0,
            writes: 0
        };

        this.powerStats = {
            static: 0,
            dynamic: 0,
            penalty: 0,
            total: 0
        };

        this.currentTime = 0;
        this.lastResult = null;

        // CPU State
        this.registers = new Array(8).fill(0); // R0-R7
        this.pc = 0x1000; // Program Counter
        this.ir = 0; // Instruction Register
        this.aluOp = 'NOP'; // Current ALU Operation
        this.aluResult = 0;
    }

    initL2() {
        const l2NumBlocks = Math.floor(this.l2.size / this.l2.blockSize);
        const l2NumSets = Math.floor(l2NumBlocks / this.l2.associativity);
        this.l2.sets = Array(l2NumSets).fill().map(() =>
            Array(this.l2.associativity).fill().map(() => ({
                valid: false,
                tag: 0,
                lruCounter: 0,
                dirty: false,
                data: null
            }))
        );
    }

    // Helper to parse address or allocate for variable
    parseAddress(addressInput) {
        if (typeof addressInput === 'string' && addressInput.startsWith('0x')) {
            return parseInt(addressInput, 16) & 0xFFFFFFFF;
        } else if (typeof addressInput === 'number') {
            return addressInput;
        } else {
            // Assume it's a variable name
            if (!this.symbolTable[addressInput]) {
                this.symbolTable[addressInput] = this.nextAllocAddress;
                this.nextAllocAddress += this.blockSize; // Allocate block-aligned address
            }
            return this.symbolTable[addressInput];
        }
    }

    access(addressInput, type = 'Read', value = null) {
        this.currentTime++;
        const address = this.parseAddress(addressInput);

        if (type === 'Write') {
            this.memory[address] = value;
        }

        const offsetMask = (1 << this.offsetBits) - 1;
        const indexMask = (1 << this.indexBits) - 1;

        const index = (address >> this.offsetBits) & indexMask;
        const tag = address >> (this.offsetBits + this.indexBits);
        const setIndex = index % this.numSets;

        this.stats.accesses++;
        if (type === 'Write') this.stats.writes++;
        else this.stats.reads++;

        // Check Hit
        const set = this.cache[setIndex];
        let hitIndex = -1;

        for (let i = 0; i < set.length; i++) {
            if (set[i].valid && set[i].tag === tag) {
                hitIndex = i;
                break;
            }
        }

        let isHit = false;
        let missType = 'None';
        let wayIndex = -1;
        let l2Hit = false; // Initialize l2Hit

        if (hitIndex !== -1) {
            // HIT
            isHit = true;
            this.stats.hits++;
            set[hitIndex].lruCounter = this.currentTime;
            wayIndex = hitIndex;

            if (type === 'Write') {
                set[hitIndex].dirty = true;
                set[hitIndex].data = value;
            }
        } else {
            // MISS
            isHit = false;
            this.stats.misses++;

            // L1 Miss, check L2
            const l2OffsetBits = Math.log2(this.l2.blockSize);
            const l2IndexBits = Math.log2(this.l2.sets.length);
            const l2IndexMask = (1 << l2IndexBits) - 1;

            const l2Index = (address >> l2OffsetBits) & l2IndexMask;
            const l2Tag = address >> (l2OffsetBits + l2IndexBits);
            const l2Set = this.l2.sets[l2Index];

            let l2HitIndex = -1;
            for (let i = 0; i < l2Set.length; i++) {
                if (l2Set[i].valid && l2Set[i].tag === l2Tag) {
                    l2HitIndex = i;
                    break;
                }
            }

            if (l2HitIndex !== -1) {
                this.l2.hits++;
                l2Hit = true; // Set L2 Hit flag
                l2Set[l2HitIndex].lruCounter = this.currentTime;
            } else {
                this.l2.misses++;
                // Data comes from Main Memory
                const ramData = this.memory[address] || null;

                // Simulate L2 replacement if needed
                let l2EmptyIndex = -1;
                for (let i = 0; i < l2Set.length; i++) {
                    if (!l2Set[i].valid) {
                        l2EmptyIndex = i;
                        break;
                    }
                }
                if (l2EmptyIndex !== -1) {
                    l2Set[l2EmptyIndex] = { valid: true, tag: l2Tag, lruCounter: this.currentTime, dirty: false, data: ramData };
                } else {
                    const l2ReplaceIndex = this.getReplacementIndex(l2Set);
                    l2Set[l2ReplaceIndex] = { valid: true, tag: l2Tag, lruCounter: this.currentTime, dirty: false, data: ramData };
                }
            }

            // Determine Miss Type for L1
            let emptyIndex = -1;
            for (let i = 0; i < set.length; i++) {
                if (!set[i].valid) {
                    emptyIndex = i;
                    break;
                }
            }

            if (emptyIndex !== -1) {
                missType = 'Compulsory';
                this.stats.compulsoryMisses++;
                set[emptyIndex] = { valid: true, tag: tag, lruCounter: this.currentTime, dirty: (type === 'Write'), data: value };
                wayIndex = emptyIndex;
            } else {
                // Replacement needed
                missType = this.numSets === 1 ? 'Capacity' : 'Conflict';
                if (missType === 'Capacity') this.stats.capacityMisses++;
                else this.stats.conflictMisses++;

                const replaceIndex = this.getReplacementIndex(set);
                set[replaceIndex] = { valid: true, tag: tag, lruCounter: this.currentTime, dirty: (type === 'Write'), data: value };
                wayIndex = replaceIndex;
            }
        }

        this.calculatePower(isHit, type);

        this.calculatePower(isHit, type);

        // Update CPU State (Simulated)
        this.pc += 4;
        this.ir = (type === 'Write' ? 0xA0000000 : 0x80000000) | (address & 0xFFFFFF); // Fake instruction
        this.aluOp = type === 'Write' ? 'STORE' : 'LOAD';

        // Update a random register to simulate data movement
        const targetReg = Math.floor(Math.random() * 8);
        if (type === 'Read' && isHit) {
            this.registers[targetReg] = set[wayIndex].data || 0;
            this.aluResult = address; // Effective address
        } else if (type === 'Write') {
            this.registers[targetReg] = value || 0;
            this.aluResult = address;
        }

        this.lastResult = {
            isHit,
            missType,
            setIndex,
            wayIndex,
            tag,
            energy: this.lastAccessEnergy,
            accessType: type,
            data: (type === 'Read' && isHit) ? set[wayIndex].data : value,
            l2Hit: l2Hit,
            address
        };
        this.lastAccessHit = isHit;
        return this.lastResult;
    }

    getReplacementIndex(set) {
        if (this.replacementPolicy === 'RANDOM') return Math.floor(Math.random() * set.length);
        if (this.replacementPolicy === 'FIFO') {
            let fifoIndex = 0;
            for (let i = 1; i < set.length; i++) {
                if (set[i].lruCounter < set[fifoIndex].lruCounter) fifoIndex = i;
            }
            return fifoIndex;
        }
        // LRU
        let lruIndex = 0;
        for (let i = 1; i < set.length; i++) {
            if (set[i].lruCounter < set[lruIndex].lruCounter) lruIndex = i;
        }
        return lruIndex;
    }

    calculatePower(isHit, accessType) {
        const voltageFactor = this.voltage * this.voltage;

        const E_bit_access = 5; // pJ per bit
        const E_tag_compare = 2; // pJ per bit
        const P_leak_per_byte = 0.5; // nW per byte

        const totalTagBits = this.numSets * this.associativity * (32 - Math.log2(this.numSets) - Math.log2(this.blockSize));
        const totalSizeBytes = this.cacheSize + (totalTagBits / 8);
        const staticLeakage = (totalSizeBytes * P_leak_per_byte) * this.voltage;
        const configuredStatic = this.powerParams.staticPower * (this.cacheSize / 1024);
        const staticEnergy = (staticLeakage + configuredStatic) * voltageFactor;

        let dynamicEnergy = 0;
        let penaltyEnergy = 0;
        if (isHit) {
            dynamicEnergy = (this.tagBits * E_tag_compare) + (this.blockSize * 8 * E_bit_access);
        } else {
            dynamicEnergy = (this.tagBits * E_tag_compare) + (this.blockSize * 8 * E_bit_access * 0.35);
            penaltyEnergy = this.powerParams.missPenaltyPower * voltageFactor;
        }

        dynamicEnergy *= voltageFactor;

        this.lastAccessEnergy = staticEnergy + dynamicEnergy + penaltyEnergy;

        this.powerStats.static += staticEnergy;
        this.powerStats.dynamic += dynamicEnergy;
        this.powerStats.penalty += penaltyEnergy;
        this.powerStats.total += this.lastAccessEnergy;
    }

    calculateAMAT() {
        const hitTime = 1;
        const missPenalty = 100;
        const missRate = this.stats.accesses > 0 ? (this.stats.misses / this.stats.accesses) : 0;
        return hitTime + (missRate * missPenalty);
    }
}
