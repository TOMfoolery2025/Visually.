/**
 * Cache Simulator Logic
 * Ported from v2 script.js
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

        this.registers = new Int32Array(32).fill(0); // x0-x31
        this.pc = 0x1000; // Program Counter
        this.labels = {}; // Label map for jumps

        this.reset();
    }

    reset() {
        this.data = new Array(this.numSets).fill(0).map(() =>
            new Array(this.associativity).fill(null)
        );
        this.symbolTable = {};
        this.memory = {};
        this.nextAllocAddress = 0x1000;

        // Reset Registers and PC
        this.registers.fill(0);
        this.pc = 0x1000;
        this.labels = {};

        // L2 Cache
        this.l2 = {
            size: 4096,
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
                dirty: false,
                data: null
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
            staticEnergy: 0,
            dynamicEnergy: 0,
            missPenaltyEnergy: 0,
            totalEnergy: 0
        };

        this.currentTime = 0;
        this.lastResult = null;
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

    parseAddress(addressInput) {
        if (typeof addressInput === 'string' && addressInput.startsWith('0x')) {
            return parseInt(addressInput, 16) & 0xFFFFFFFF;
        } else if (typeof addressInput === 'number') {
            return addressInput;
        } else {
            if (!this.symbolTable[addressInput]) {
                this.symbolTable[addressInput] = this.nextAllocAddress;
                this.nextAllocAddress += this.blockSize;
            }
            return this.symbolTable[addressInput];
        }
    }

    // New: Parse and Execute Assembly Line
    executeLine(line) {
        line = line.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) return null;

        // Check for Label
        if (line.includes(':')) {
            const parts = line.split(':');
            const label = parts[0].trim();
            this.labels[label] = this.pc; // Store label address (mock)
            line = parts[1].trim();
            if (!line) return null;
        }

        // Basic Instruction Parsing
        const parts = line.replace(/,/g, ' ').split(/\s+/);
        const opcode = parts[0].toUpperCase();

        // Helper to get reg index: x1 -> 1
        const getReg = (r) => {
            if (!r) return 0;
            if (r.startsWith('x')) return parseInt(r.substring(1));
            // Handle ABI names if needed (zero, ra, sp, etc.) - keeping simple for now
            return 0;
        };

        // Helper to parse immediate or offset(base)
        const parseImm = (val) => parseInt(val);

        let memoryAccess = null;

        let aluResult = { op: 'IDLE', a: '---', b: '---', res: '---' };

        switch (opcode) {
            case 'ADD': // ADD rd, rs1, rs2
                {
                    const rd = getReg(parts[1]);
                    const rs1Val = this.registers[getReg(parts[2])];
                    const rs2Val = this.registers[getReg(parts[3])];
                    const res = rs1Val + rs2Val;
                    this.registers[rd] = res;
                    aluResult = { op: 'ADD', a: rs1Val, b: rs2Val, res: res };
                }
                break;
            case 'SUB': // SUB rd, rs1, rs2
                {
                    const rd = getReg(parts[1]);
                    const rs1Val = this.registers[getReg(parts[2])];
                    const rs2Val = this.registers[getReg(parts[3])];
                    const res = rs1Val - rs2Val;
                    this.registers[rd] = res;
                    aluResult = { op: 'SUB', a: rs1Val, b: rs2Val, res: res };
                }
                break;
            case 'ADDI': // ADDI rd, rs1, imm
                {
                    const rd = getReg(parts[1]);
                    const rs1Val = this.registers[getReg(parts[2])];
                    const imm = parseImm(parts[3]);
                    const res = rs1Val + imm;
                    this.registers[rd] = res;
                    aluResult = { op: 'ADDI', a: rs1Val, b: imm, res: res };
                }
                break;
            case 'LW': // LW rd, offset(rs1)
                {
                    const rd = getReg(parts[1]);
                    const memOp = parts[2]; // offset(base)
                    const offset = parseInt(memOp.split('(')[0]);
                    const baseReg = getReg(memOp.split('(')[1].replace(')', ''));
                    const baseVal = this.registers[baseReg];
                    const addr = baseVal + offset;
                    memoryAccess = { address: addr, type: 'Read', reg: rd };
                    aluResult = { op: 'ADD (Addr)', a: baseVal, b: offset, res: addr };
                }
                break;
            case 'SW': // SW rs2, offset(rs1)
                {
                    const rs2 = getReg(parts[1]);
                    const memOp = parts[2];
                    const offset = parseInt(memOp.split('(')[0]);
                    const baseReg = getReg(memOp.split('(')[1].replace(')', ''));
                    const baseVal = this.registers[baseReg];
                    const addr = baseVal + offset;
                    const val = this.registers[rs2];
                    memoryAccess = { address: addr, type: 'Write', value: val };
                    aluResult = { op: 'ADD (Addr)', a: baseVal, b: offset, res: addr };
                }
                break;
            // Add more as needed (BEQ, JAL, etc.)
            default:
                // Fallback for raw addresses or variables (legacy mode)
                if (line.startsWith('0x') || line.includes('=')) {
                    // Handle variable assignment: var x = 10
                    if (line.startsWith('var')) {
                        // Mock variable handling
                        return null;
                    }
                    const result = this.access(line); // Treat as raw access
                    // Attach mock ALU info for raw access
                    result.alu = { op: 'MEM', a: '---', b: '---', res: parseInt(line) };
                    return result;
                }
                break;
        }

        this.registers[0] = 0; // x0 always 0
        this.pc += 4;

        if (memoryAccess) {
            const result = this.access(memoryAccess.address, memoryAccess.type, memoryAccess.value);
            if (memoryAccess.type === 'Read' && result.isHit) {
                // If hit, load data into register (mock data if null)
                this.registers[memoryAccess.reg] = result.data || 0;
            }
            // Attach ALU info to result
            result.alu = aluResult;
            return result;
        }

        // Return result even if no memory access, to show ALU op
        return {
            isHit: false, // Not a memory hit
            missType: 'None',
            setIndex: -1,
            wayIndex: -1,
            tag: 0,
            energy: 0, // Could calculate ALU energy
            accessType: 'ALU',
            data: null,
            l2Hit: false,
            address: 0,
            alu: aluResult
        };
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
        let l2Hit = false;

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
                l2Hit = true;
                l2Set[l2HitIndex].lruCounter = this.currentTime;
            } else {
                this.l2.misses++;
                const ramData = this.memory[address] || null;

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
                missType = this.numSets === 1 ? 'Capacity' : 'Conflict';
                if (missType === 'Capacity') this.stats.capacityMisses++;
                else this.stats.conflictMisses++;

                const replaceIndex = this.getReplacementIndex(set);
                set[replaceIndex] = { valid: true, tag: tag, lruCounter: this.currentTime, dirty: (type === 'Write'), data: value };
                wayIndex = replaceIndex;
            }
        }

        this.calculatePower(isHit, type);

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

        const E_bit_access = 5;
        const E_tag_compare = 2;
        const P_leak_per_byte = 0.5;

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

        this.powerStats.staticEnergy += staticEnergy;
        this.powerStats.dynamicEnergy += dynamicEnergy;
        this.powerStats.missPenaltyEnergy += penaltyEnergy;
        this.powerStats.totalEnergy += this.lastAccessEnergy;
    }

    calculateAMAT() {
        const hitTime = 1;
        const missPenalty = 100;
        const missRate = this.stats.accesses > 0 ? (this.stats.misses / this.stats.accesses) : 0;
        return hitTime + (missRate * missPenalty);
    }
}
