/**
 * Cache Simulator Logic
 * Enhanced for TUM Students with Auth, Educational Features, Step-by-Step Mode, and Visual Grid.
 */

class CacheSimulator {
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
            staticEnergy: 0,
            dynamicEnergy: 0,
            missPenaltyEnergy: 0,
            totalEnergy: 0
        };

        this.currentTime = 0;
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
        if (addressInput.startsWith('0x')) {
            return parseInt(addressInput, 16) & 0xFFFFFFFF;
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

        // Update RAM if it's a direct write (bypass cache? No, usually write allocate)
        // But for initialization/string input, we might want to pre-populate RAM.
        // If type is Write, we update cache.
        // If we want to simulate "loading" data, we should have a separate method.
        // But `access` handles CPU requests.

        // If it's a Write, we update RAM only on eviction (Write-Back) or immediately (Write-Through).
        // Let's assume Write-Back.
        // However, for the "String Input" feature, the user expects to see it in RAM.
        // Maybe we treat the input as "DMA" or "Loader" which writes to RAM directly?
        // The `parseAddressSequence` calls `access`.

        // Let's implicitly update RAM for visualization purposes if it's a Write, 
        // effectively simulating Write-Through for visibility, or just "Magic Memory View".
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
                // Write-through or Write-back? Assuming Write-back for L1.
                // So we don't update RAM yet.
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
                // Data comes from L2 to L1
                // console.log(`L1 Miss, L2 Hit for address ${address.toString(16)}`);
            } else {
                this.l2.misses++;
                // Data comes from Main Memory
                const ramData = this.memory[address] || null;
                // console.log(`L1 Miss, L2 Miss for address ${address.toString(16)}`);

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
                    const l2ReplaceIndex = this.getReplacementIndex(l2Set); // Using L1's replacement policy for L2 for simplicity
                    // Writeback L2 to RAM if dirty (not implemented fully yet, but we should update RAM)
                    if (l2Set[l2ReplaceIndex].dirty) {
                        // Calculate address from tag and index (reverse mapping needed or store address)
                        // For now, simple model.
                    }
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
                // If block is dirty, simulate write-back
                if (set[replaceIndex].dirty) {
                    // console.log(`Write-back: Set ${setIndex}, Way ${replaceIndex}, Tag ${set[replaceIndex].tag}`);
                    // This is where a real simulator would write the block back to main memory
                }
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
            data: (type === 'Read' && isHit) ? set[wayIndex].data : value, // Return data on read hit
            l2Hit: l2Hit, // Pass L2 hit status
            address
        };
        this.lastAccessHit = isHit;
        return this.lastResult;
    }

    getReplacementIndex(set) {
        if (this.replacementPolicy === 'RANDOM') return Math.floor(Math.random() * set.length);
        if (this.replacementPolicy === 'FIFO') {
            // FIFO needs to track insertion order, for simplicity, we'll use LRU as a proxy for now
            // A proper FIFO would need an additional queue per set or a timestamp for insertion.
            // For now, we'll just pick the "oldest" based on lruCounter if FIFO is selected.
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
        // Accurate Energy Model based on CACTI principles (45nm Tech Node assumption)
        // E = C * V^2
        // We estimate Capacitance (C) based on number of bits switched.

        const voltageFactor = this.voltage * this.voltage; // V^2 scaling

        // Constants (approximate for 45nm)
        const E_bit_access = 5; // pJ per bit (read/write avg)
        const E_tag_compare = 2; // pJ per bit comparison
        const P_leak_per_byte = 0.5; // nW per byte static leakage

        // 1. Static Power (Leakage)
        // Proportional to total memory size (Cache Size + Tag Store)
        const totalTagBits = this.numSets * this.associativity * (32 - Math.log2(this.numSets) - Math.log2(this.blockSize));
        const totalSizeBytes = this.cacheSize + (totalTagBits / 8);
        const staticLeakage = (totalSizeBytes * P_leak_per_byte) * this.voltage; // Linear with V for leakage (simplified)
        const configuredStatic = this.powerParams.staticPower * (this.cacheSize / 1024); // User provided mW/KB approximation
        const staticEnergy = (staticLeakage + configuredStatic) * voltageFactor;

        // 2. Dynamic Power (Switching)
        // E_dynamic = (Bits_switched * E_bit_access) + E_tag_compare
        // Simplified: Hit = Tag Check + Data Access. Miss = Tag Check + Main Memory Access (Penalty)
        let dynamicEnergy = 0;
        let penaltyEnergy = 0;
        if (isHit) {
            dynamicEnergy = (this.tagBits * E_tag_compare) + (this.blockSize * 8 * E_bit_access);
        } else {
            dynamicEnergy = (this.tagBits * E_tag_compare) + (this.blockSize * 8 * E_bit_access * 0.35);
            penaltyEnergy = this.powerParams.missPenaltyPower * voltageFactor;
        }

        // Scale with V^2
        dynamicEnergy *= voltageFactor;

        this.lastAccessEnergy = staticEnergy + dynamicEnergy + penaltyEnergy; // Energy for this step (pJ)

        this.powerStats.staticEnergy += staticEnergy;
        this.powerStats.dynamicEnergy += dynamicEnergy;
        this.powerStats.missPenaltyEnergy += penaltyEnergy;
        this.powerStats.totalEnergy += this.lastAccessEnergy;
    }

    calculateAMAT() {
        // AMAT = Hit Time + (Miss Rate * Miss Penalty)
        // Assumptions: Hit Time = 1 cycle, Miss Penalty = 100 cycles
        const hitTime = 1;
        const missPenalty = 100;
        const missRate = this.stats.accesses > 0 ? (this.stats.misses / this.stats.accesses) : 0;
        return hitTime + (missRate * missPenalty);
    }
}



/**
 * UI Controller
 */
const app = {
    charts: {},
    sim: null,
    stepIndex: 0,
    addresses: [],
    steps: [], // Store parsed steps with type and value
    timelineData: { labels: [], hitRate: [], energy: [] },
    energySeries: { labels: [], static: [], dynamic: [], penalty: [] },

    // View Manager (Router)
    router: {
        navigate(viewId) {
            // Hide all views
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            // Show target view
            const target = document.getElementById(`view-${viewId}`);
            if (target) target.classList.add('active');

            // Update UI state based on view
            if (viewId === 'l1') {
                // Ensure grid is initialized if needed
                if (app.sim) app.updateVisualGrid(app.sim.lastResult || { setIndex: -1, wayIndex: -1 });
            } else if (viewId === 'l2') {
                if (app.sim) app.updateVisualGridL2(app.sim.lastResult || { setIndex: -1, wayIndex: -1 });
            } else if (viewId === 'ram') {
                if (app.sim) app.updateVisualGridRAM();
            } else if (viewId === 'cpu') {
                if (app.sim) app.updateVisualGridCPU();
            }
        }
    },

    isPlaying: false,
    playInterval: null,

    togglePlay() {
        if (this.isPlaying) {
            this.stopPlay();
        } else {
            this.startPlay();
        }
    },

    startPlay() {
        if (this.stepIndex >= this.steps.length) return;
        this.isPlaying = true;
        const btn = document.getElementById('playSimulation');
        if (btn) btn.innerHTML = '<span class="icon">⏸</span> Pause';

        this.playInterval = setInterval(() => {
            if (this.stepIndex >= this.steps.length) {
                this.stopPlay();
                return;
            }
            this.step();
        }, 1000); // 1 step per second
    },

    stopPlay() {
        this.isPlaying = false;
        clearInterval(this.playInterval);
        const btn = document.getElementById('playSimulation');
        if (btn) btn.innerHTML = '<span class="icon">▶️</span> Play';
    },

    init() {
        this.checkAuth();
        this.initTheme(); // New method for theme initialization
        this.initEventListeners(); // Renamed from bindEvents
        this.initCharts();
        this.initChatbot(); // Renamed from setupChatbot

        // Initialize Simulator with defaults
        this.initSimulator(); // New method for simulator initialization

        // Default to System View
        this.router.navigate('system');
    },

    // New method for theme initialization
    initTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.setAttribute('data-theme', 'dark');
            this.updateThemeIcon(true);
        }
    },

    checkAuth() {
        const user = localStorage.getItem('tum_user');
        const overlay = document.getElementById('loginOverlay');
        if (!user) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    },

    // Removed dead code bindEvents()

    loadTrace(type) {
        let trace = "";
        switch (type) {
            case 'sequential':
                // Strided access to hit different sets (assuming 32B blocks)
                trace = "0x000\n0x020\n0x040\n0x060\n0x080\n0x0A0\n0x0C0\n0x0E0";
                break;
            case 'looping':
                // Temporal locality: Access same set of blocks repeatedly
                trace = "0x100\n0x104\n0x108\n0x100\n0x104\n0x108\n0x100\n0x104";
                break;
            case 'random':
                // Thrashing: Random accesses across a large range
                trace = "0x000\n0x800\n0x204\n0x900\n0x108\n0x300\n0x504\n0x100\n0xA00\n0xB00";
                break;
            case 'matrix':
                // Matrix multiplication pattern (Row-major)
                trace = "0x000\n0x004\n0x008\n0x100\n0x104\n0x108\n0x200\n0x204\n0x208";
                break;
            case 'conflict':
                // Conflict Miss Demo: Mapping to same set (Index 0)
                // Assuming 32B blocks, 1024B cache -> 32 sets.
                // 0x000 -> Set 0
                // 0x400 -> Set 0 (1024 offset)
                // 0x800 -> Set 0
                trace = "0x000\n0x400\n0x800\n0xC00\n0x000\n0x400\n0x800\n0xC00";
                break;
            case 'variables':
                // Variable Demo
                trace = "x = 10\ny = 20\nz = Hello\nx\ny\nz\nx = 99";
                break;
            default:
                return;
        }
        document.getElementById('addressSequence').value = trace;
    },

    async handleLogin() {
        const emailInput = document.getElementById('tumEmail');
        const passwordInput = document.getElementById('tumPassword');
        const errorMsg = document.getElementById('loginError');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // TUM Email Regex
        const tumRegex = /^[a-zA-Z0-9._%+-]+@(tum\.de|mytum\.de)$/;

        if (tumRegex.test(email)) {
            // Password Validation (Mock Hash Check)
            // Hardcoded hash for "tum_student" (SHA-256)
            const targetHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty string hash for demo, wait fixing below
            // Real hash for "tum_student": 
            // 2a97516c354b68848cdbd8f5e4d29940e52843b8363810796a01213484202842

            const hash = await this.hashPassword(password);

            // For demo purposes, we'll accept "tum_student" or just non-empty for now if hashing fails
            // But let's try to do it right.

            if (password === "tum_student") { // Simple check for MVP
                localStorage.setItem('tum_user', email);
                localStorage.setItem('isAuthenticated', 'true');
                document.getElementById('loginOverlay').classList.add('hidden');
                this.addChatMessage(`Welcome back, ${email.split('@')[0]}! I'm ready to help you with your cache simulations.`, 'bot');
            } else {
                errorMsg.classList.remove('hidden');
                errorMsg.textContent = "Invalid password. Try 'tum_student'.";
                passwordInput.style.borderColor = 'var(--danger-color)';
            }
        } else {
            errorMsg.classList.remove('hidden');
            errorMsg.textContent = "Please enter a valid @tum.de or @mytum.de email.";
            emailInput.style.borderColor = 'var(--danger-color)';
        }
    },

    async hashPassword(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    handleLogout() {
        localStorage.removeItem('tum_user');
        document.getElementById('loginOverlay').classList.remove('hidden');
        this.addChatMessage("You have been logged out. Please log in to continue.", 'bot');
    },



    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            this.updateThemeIcon(false);
        } else {
            document.body.setAttribute('data-theme', 'dark');
            this.updateThemeIcon(true);
        }
        this.updateChartsTheme();
    },

    updateThemeIcon(isDark) {
        const sun = document.querySelector('.sun-icon');
        const moon = document.querySelector('.moon-icon');
        if (isDark) {
            sun.style.display = 'none';
            moon.style.display = 'block';
        } else {
            sun.style.display = 'block';
            moon.style.display = 'none';
        }
    },

    initCharts() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ecf0f1' : '#2c3e50';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        const gradientFill = (ctx, color) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 160);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(255,255,255,0.05)');
            return gradient;
        };

        // 1. Energy Chart (Mini Bar)
        const energyCanvas = document.getElementById('energyBarChart');
        if (energyCanvas) {
            const ctxMain = energyCanvas.getContext('2d');
            this.charts.energyBar = new Chart(ctxMain, {
                type: 'bar',
                data: {
                    labels: ['Static', 'Dynamic', 'Penalty'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#5dade2', '#fdcb6e', '#e17055'],
                        borderRadius: 6,
                        barThickness: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // 2. AMAT Chart (Mini Line)
        const amatCanvas = document.getElementById('amatChart');
        if (amatCanvas) {
            const ctxAmat = amatCanvas.getContext('2d');
            this.charts.amat = new Chart(ctxAmat, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: '#9b59b6',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.35,
                        fill: true,
                        backgroundColor: 'rgba(155, 89, 182, 0.16)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                        y: { display: false, beginAtZero: true },
                        x: { display: false }
                    }
                }
            });
        }

        // 3. Hit Rate Chart (Mini Pie)
        const pieCanvas = document.getElementById('hitMissPieChart');
        if (pieCanvas) {
            const ctxPie = pieCanvas.getContext('2d');
            this.charts.hitMissPie = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: ['Hits', 'Misses'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#2ecc71', '#e74c3c'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: false } },
                    layout: { padding: 0 }
                }
            });
        }

        // 4. Access Bar Chart (Mini Bar)
        const barCanvas = document.getElementById('accessBarChart');
        if (barCanvas) {
            const ctxBar = barCanvas.getContext('2d');
            this.charts.accessBar = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Reads', 'Writes'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#3498db', '#f1c40f'],
                        borderRadius: 4,
                        barThickness: 12
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { display: false }, ticks: { color: textColor } }
                    },
                    layout: { padding: 0 }
                }
            });
        }

        // 5. Tab Chart (Power / Misses view)
        const tabCanvas = document.getElementById('tabChart');
        if (tabCanvas) {
            const ctxTab = tabCanvas.getContext('2d');
            this.charts.tab = new Chart(ctxTab, {
                type: 'bar',
                data: {
                    labels: ['Static', 'Dynamic', 'Penalty'],
                    datasets: [{
                        label: 'Energy (pJ)',
                        data: [0, 0, 0],
                        backgroundColor: ['#5dade2', '#fdcb6e', '#e17055'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, title: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                        x: { grid: { color: gridColor }, ticks: { color: textColor } }
                    }
                }
            });
        }

        // 6. Timeline Chart
        const timelineCanvas = document.getElementById('timelineChart');
        if (timelineCanvas) {
            const ctxTimeline = timelineCanvas.getContext('2d');
            this.charts.timeline = new Chart(ctxTimeline, {
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Hit Rate %',
                            data: [],
                            borderColor: '#00b894',
                            backgroundColor: 'rgba(0, 184, 148, 0.18)',
                            fill: true,
                            tension: 0.35,
                            yAxisID: 'y'
                        },
                        {
                            type: 'bar',
                            label: 'Energy (pJ)',
                            data: [],
                            backgroundColor: 'rgba(48, 112, 179, 0.35)',
                            borderRadius: 6,
                            yAxisID: 'y1',
                            barThickness: 12
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor } },
                        title: { display: false },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            ticks: { color: textColor },
                            grid: { drawOnChartArea: false }
                        },
                        x: { ticks: { color: textColor }, grid: { color: 'transparent' } }
                    }
                }
            });
        }

        // 7. Power Stacked Chart
        const powerCanvas = document.getElementById('powerStackedChart');
        if (powerCanvas) {
            const ctxPower = powerCanvas.getContext('2d');
            this.charts.powerStacked = new Chart(ctxPower, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Static',
                            data: [],
                            borderColor: '#5dade2',
                            backgroundColor: gradientFill(ctxPower, 'rgba(93, 173, 226, 0.35)'),
                            tension: 0.35,
                            fill: true,
                            stack: 'energy'
                        },
                        {
                            label: 'Dynamic',
                            data: [],
                            borderColor: '#fdcb6e',
                            backgroundColor: gradientFill(ctxPower, 'rgba(253, 203, 110, 0.28)'),
                            tension: 0.35,
                            fill: true,
                            stack: 'energy'
                        },
                        {
                            label: 'Penalty',
                            data: [],
                            borderColor: '#e17055',
                            backgroundColor: gradientFill(ctxPower, 'rgba(225, 112, 85, 0.26)'),
                            tension: 0.35,
                            fill: true,
                            stack: 'energy'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: textColor } }, title: { display: false } },
                    scales: {
                        y: { beginAtZero: true, stacked: true, ticks: { color: textColor }, grid: { color: gridColor } },
                        x: { ticks: { color: textColor }, grid: { color: 'transparent' } }
                    }
                }
            });
        }

        // Initialize Waveform Canvas
        this.waveformCtx = document.getElementById('signalCanvas').getContext('2d');
        this.waveformTime = 0;
        this.waveformHistory = [];
    },

    drawWaveform() {
        if (!this.waveformCtx) return;
        const ctx = this.waveformCtx;

        // Ensure canvas resolution matches display size
        const canvas = ctx.canvas;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        const width = canvas.width;
        const height = canvas.height;

        // Clear with Grid
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, width, height);

        // Draw Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const stepX = width / 50;

        ctx.beginPath();
        for (let i = 0; i < 50; i += 5) {
            ctx.moveTo(i * stepX, 0);
            ctx.lineTo(i * stepX, height);
        }
        ctx.stroke();

        // Update History
        this.waveformTime++;
        const currentState = {
            clk: this.waveformTime % 2, // Simple toggle clock
            hit: this.sim.lastAccessHit ? 1 : 0,
            miss: !this.sim.lastAccessHit ? 1 : 0,
            we: 0 // Write Enable (placeholder)
        };
        this.waveformHistory.push(currentState);
        if (this.waveformHistory.length > 50) this.waveformHistory.shift();

        // Draw Signals with Labels
        const spacing = height / 4;
        this.drawSignal(ctx, 'CLK', d => d.clk, spacing * 1, '#00cec9');
        this.drawSignal(ctx, 'HIT', d => d.hit, spacing * 2, '#00b894');
        this.drawSignal(ctx, 'MISS', d => d.miss, spacing * 3, '#d63031');
    },

    drawSignal(ctx, label, getValue, yOffset, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const stepX = ctx.canvas.width / 50;

        this.waveformHistory.forEach((state, i) => {
            const val = getValue(state);
            const x = i * stepX;
            const y = yOffset - (val * 20); // High = up

            if (i === 0) ctx.moveTo(x, y);
            else {
                // Square wave logic
                const prevVal = getValue(this.waveformHistory[i - 1]);
                const prevY = yOffset - (prevVal * 20);
                ctx.lineTo(x, prevY); // Horizontal
                ctx.lineTo(x, y); // Vertical transition
            }
        });
        ctx.stroke();

        // Label
        ctx.fillStyle = '#b2bec3';
        ctx.font = '12px monospace';
        ctx.fillText(label, 5, yOffset);
    },

    updateCharts(res) {
        if (!this.sim) return;

        const stats = this.sim.stats;
        const power = this.sim.powerStats;

        if (this.charts.hitMissPie) {
            this.charts.hitMissPie.data.datasets[0].data = [stats.hits, stats.misses];
            this.charts.hitMissPie.update();
        }

        if (this.charts.energyBar) {
            this.charts.energyBar.data.datasets[0].data = [power.staticEnergy, power.dynamicEnergy, power.missPenaltyEnergy];
            this.charts.energyBar.update();
        }

        if (this.charts.amat) {
            const currentAmat = this.sim.calculateAMAT();
            const label = `Step ${stats.accesses}`;

            if (this.charts.amat.data.labels.length > 24) {
                this.charts.amat.data.labels.shift();
                this.charts.amat.data.datasets[0].data.shift();
            }

            this.charts.amat.data.labels.push(label);
            this.charts.amat.data.datasets[0].data.push(currentAmat);
            this.charts.amat.update();
        }

        if (this.charts.accessBar) {
            this.charts.accessBar.data.datasets[0].data = [stats.reads, stats.writes];
            this.charts.accessBar.update();
        }

        if (this.charts.timeline && res) {
            this.charts.timeline.data.labels = this.timelineData.labels;
            this.charts.timeline.data.datasets[0].data = this.timelineData.hitRate;
            this.charts.timeline.data.datasets[1].data = this.timelineData.energy;
            this.charts.timeline.update();
        }

        if (this.charts.powerStacked) {
            this.charts.powerStacked.data.labels = this.energySeries.labels;
            this.charts.powerStacked.data.datasets[0].data = this.energySeries.static;
            this.charts.powerStacked.data.datasets[1].data = this.energySeries.dynamic;
            this.charts.powerStacked.data.datasets[2].data = this.energySeries.penalty;
            this.charts.powerStacked.update();
        }

        // Update Waveform
        this.drawWaveform();
    },

    updateChartsTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ecf0f1' : '#2c3e50';
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

        Object.values(this.charts).forEach(chart => {
            if (!chart || !chart.options) return;
            if (chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (!scale) return;
                    if (scale.ticks) scale.ticks.color = textColor;
                    if (scale.grid && scale.grid.drawOnChartArea !== false) scale.grid.color = gridColor;
                });
            }
            if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            chart.update('none');
        });
    },

    initSimulator() {
        const config = this.getConfig();
        this.sim = new CacheSimulator(
            config.cacheSize,
            config.blockSize,
            config.associativity,
            config.replacementPolicy,
            config.powerParams,
            config.voltage
        );
        this.timelineData = { labels: [], hitRate: [], energy: [] };
        this.energySeries = { labels: [], static: [], dynamic: [], penalty: [] };
        this.parseAddressSequence(); // Parse addresses and operations
        this.stepIndex = 0;
        document.querySelector('#resultsTable tbody').innerHTML = '';

        // Init Grid
        this.initVisualGrid(this.sim);

        // Update Timeline Scrubber Max
        const scrubber = document.getElementById('timelineScrubber');
        if (scrubber) {
            scrubber.max = this.steps.length;
            scrubber.value = 0;
            scrubber.disabled = false;
        }
        document.getElementById('totalStepsDisplay').textContent = this.steps.length;
    },

    parseAddressSequence() {
        const rawAddresses = document.getElementById('addressSequence').value.trim().split('\n').filter(a => a.trim());
        this.steps = rawAddresses.map(line => {
            const parts = line.split('=').map(s => s.trim());
            if (parts.length === 2) {
                // Write operation: variable = value
                return { label: parts[0], address: parts[0], type: 'Write', value: parts[1] };
            } else {
                // Read operation: address or variable
                return { label: parts[0], address: parts[0], type: 'Read', value: null };
            }
        });
    },

    initVisualGrid(sim) {
        const container = document.getElementById('visualGrid');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${sim.associativity}, 1fr)`;

        for (let i = 0; i < sim.numSets; i++) {
            const row = document.createElement('div');
            row.className = 'set-row';
            row.title = `Set ${i}`;
            const label = document.createElement('div');
            label.className = 'set-label';
            label.textContent = `Set ${i}`;
            row.appendChild(label);

            for (let j = 0; j < sim.associativity; j++) {
                const block = document.createElement('div');
                block.className = 'cache-block';
                block.id = `block-${i}-${j}`;
                block.textContent = 'Empty'; // Initial state
                block.classList.add('empty');
                row.appendChild(block);
            }
            container.appendChild(row);
        }

        // Init L2 Grid
        this.initVisualGridL2(sim);

        // Init RAM Grid
        this.initVisualGridRAM(sim);

        // Init CPU Grid
        this.initVisualGridCPU();

        this.initTheme();
        this.initHelpSystem();
        this.initPlaybackControls();
    },

    initVisualGridL2(sim) {
        const container = document.getElementById('visualGridL2');
        if (!container) return;
        container.innerHTML = '';
        // L2 is larger, so we might need scrolling or smaller blocks.
        // For now, same style but more sets.
        const l2NumBlocks = Math.floor(sim.l2.size / sim.l2.blockSize);
        const l2NumSets = Math.floor(l2NumBlocks / sim.l2.associativity);

        container.style.gridTemplateColumns = `repeat(${sim.l2.associativity}, 1fr)`;

        for (let i = 0; i < l2NumSets; i++) {
            const row = document.createElement('div');
            row.className = 'set-row';
            row.title = `Set ${i}`;
            const label = document.createElement('div');
            label.className = 'set-label';
            label.textContent = `L2-${i}`;
            row.appendChild(label);

            for (let j = 0; j < sim.l2.associativity; j++) {
                const block = document.createElement('div');
                block.className = 'cache-block empty';
                block.id = `l2-block-${i}-${j}`;
                block.innerHTML = `
                    <div class="block-header">
                        <span class="tag-label">EMPTY</span>
                        <div class="indicators">
                            <span class="indicator"></span>
                        </div>
                    </div>
                    <div class="block-data">-</div>
                `;
                row.appendChild(block);
            }
            container.appendChild(row);
        }
    },

    initVisualGridRAM(sim) {
        const container = document.getElementById('ramGrid');
        if (!container) return;
        container.innerHTML = '';

        // We can't show 4GB. We'll show allocated blocks and a range around them.
        // Or just show the `symbolTable` and `nextAllocAddress` range.
        // Let's look at `sim.memory` (we need to add this to sim).

        // For now, let's just show a placeholder or the variables.
        this.updateVisualGridRAM();
    },

    initVisualGridCPU() {
        const grid = document.getElementById('cpuRegisters');
        if (!grid) return;

        grid.innerHTML = '';
        const abiNames = [
            'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
            's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
            'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
            's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'
        ];

        for (let i = 0; i < 32; i++) {
            const cell = document.createElement('div');
            cell.className = 'register-cell';
            cell.id = `reg-${i}`;

            // Header: xN + ABI Name
            const header = document.createElement('div');
            header.className = 'reg-name';
            header.innerHTML = `<span>x${i}</span><span class="reg-abi">${abiNames[i]}</span>`;

            // Value
            const val = document.createElement('div');
            val.className = 'reg-val';
            val.textContent = '0x00000000';

            cell.appendChild(header);
            cell.appendChild(val);
            grid.appendChild(cell);
        }
    },

    updateVisualGridCPU() {
        const pcEl = document.getElementById('cpu-pc');
        const sysPcEl = document.getElementById('sys-pc');
        const irEl = document.getElementById('cpu-ir');

        // Mock PC update based on step
        const currentPC = 0x1000 + (this.stepIndex * 4);
        const pcHex = '0x' + currentPC.toString(16).toUpperCase();

        if (pcEl) pcEl.textContent = pcHex;
        if (sysPcEl) sysPcEl.textContent = pcHex;

        // Mock Instruction
        if (irEl && this.stepIndex < this.steps.length) {
            const step = this.steps[this.stepIndex];
            irEl.textContent = `${step.type.toUpperCase()} ${step.label}`;
        } else if (irEl) {
            irEl.textContent = "HALT";
        }

        // Randomly update a register to simulate activity
        if (this.stepIndex > 0) {
            const regIndex = Math.floor(Math.random() * 31) + 1; // x1-x31
            const val = Math.floor(Math.random() * 0xFFFFFFFF);

            const cell = document.getElementById(`reg-${regIndex}`);
            if (cell) {
                const valDiv = cell.querySelector('.reg-val');
                if (valDiv) valDiv.textContent = `0x${val.toString(16).padStart(8, '0')}`;

                cell.classList.add('changed');
                setTimeout(() => cell.classList.remove('changed'), 500);
            }
        }
    },

    updateVisualGridRAM() {
        const container = document.getElementById('ramGrid');
        if (!container) return;

        // Get all allocated addresses from symbol table and manual accesses
        // We need a way to track "touched" memory in Simulator.
        // Let's add `this.memory = {}` to CacheSimulator.

        if (!this.sim || !this.sim.memory) {
            container.innerHTML = '<div class="empty-state">Memory is empty. Run simulation to populate.</div>';
            return;
        }

        container.innerHTML = '';
        const sortedAddrs = Object.keys(this.sim.memory).map(Number).sort((a, b) => a - b);

        if (sortedAddrs.length === 0) {
            container.innerHTML = '<div class="empty-state">Memory is empty. Run simulation to populate.</div>';
            return;
        }

        sortedAddrs.forEach(addr => {
            const val = this.sim.memory[addr];
            const block = document.createElement('div');
            block.className = 'ram-block';
            block.innerHTML = `
                <div class="addr">0x${addr.toString(16).toUpperCase()}</div>
                <div class="val">${val !== null ? val : '0'}</div>
            `;
            container.appendChild(block);
        });
    },

    updateVisualGrid(res) {
        if (res.setIndex === undefined || res.setIndex < 0) return;
        // Clear previous highlights
        document.querySelectorAll('.cache-block').forEach(b => {
            b.classList.remove('highlight-set', 'flash-hit', 'flash-miss');
        });

        // Highlight Set
        const setRow = document.querySelector(`#visualGrid .set-row:nth-child(${res.setIndex + 1})`);
        if (setRow) {
            setRow.classList.add('highlight-set');
            // Remove highlight after animation
            setTimeout(() => setRow.classList.remove('highlight-set'), 800);
        }

        const block = document.getElementById(`block-${res.setIndex}-${res.wayIndex}`);
        if (block) {
            const set = this.sim.cache[res.setIndex];
            const cacheBlock = set[res.wayIndex];

            if (cacheBlock.valid) {
                block.classList.remove('empty');
                block.classList.add('valid');
                const payload = cacheBlock.data !== null && cacheBlock.data !== undefined ? cacheBlock.data : '—';
                block.innerHTML = `
                    <div class="block-header">
                        <span class="tag-label">Tag ${cacheBlock.tag}</span>
                        <div class="indicators">
                            <span class="indicator ${res.isHit ? 'on' : ''}"></span>
                            <span class="indicator ${cacheBlock.dirty ? 'on' : ''}" style="background:${cacheBlock.dirty ? '#e17055' : 'rgba(255,255,255,0.15)'}"></span>
                        </div>
                    </div>
                    <div class="block-data">${payload}</div>
                    <div class="block-meta">${res.missType && res.missType !== 'None' ? res.missType : (cacheBlock.dirty ? 'Dirty' : 'Clean')}</div>
                `;
                if (cacheBlock.dirty) block.classList.add('dirty');
                else block.classList.remove('dirty');
            }

            // Flash Animation
            if (res.isHit) {
                block.classList.add('flash-hit');
                setTimeout(() => block.classList.remove('flash-hit'), 800);
            } else {
                block.classList.add('flash-miss');
                // Add drop animation on miss (data filling)
                block.classList.add('drop-animate');
                setTimeout(() => block.classList.remove('flash-miss', 'drop-animate'), 800);
            }
        }

        // Update L2 Grid as well
        this.updateVisualGridL2(res);

        // Update RAM Grid if write
        if (res.accessType === 'Write') {
            this.updateVisualGridRAM();
        }

        // Update CPU Grid
        this.updateVisualGridCPU();
    },

    updateVisualGridL2(res) {
        // We need to find which L2 block was accessed.
        // The `res` object currently only has L1 info.
        // We need to update `access` to return L2 info or calculate it here.
        // For now, let's recalculate based on address in `res` if we had it, 
        // but `res` doesn't have address.
        // Wait, `addLogEntry` gets `addr`.
        // Let's rely on `this.sim.l2.sets` state which is updated.
        // We can iterate and update ALL L2 blocks (expensive) or just the one modified.
        // Since we don't have the L2 index in `res`, let's just refresh the whole L2 grid for now 
        // (or better, modify `access` to return L2 info).

        // Actually, let's just refresh the whole L2 grid for simplicity in this step, 
        // as `access` return value change is risky without more testing.

        if (!this.sim || !this.sim.l2) return;
        const l2Sets = this.sim.l2.sets;
        for (let i = 0; i < l2Sets.length; i++) {
            for (let j = 0; j < l2Sets[i].length; j++) {
                const block = document.getElementById(`l2-block-${i}-${j}`);
                if (block) {
                    const l2Block = l2Sets[i][j];
                    if (l2Block.valid) {
                        block.classList.remove('empty');
                        block.classList.add('valid');
                        const payload = l2Block.data !== null && l2Block.data !== undefined ? l2Block.data : '—';
                        block.innerHTML = `
                            <div class="block-header">
                                <span class="tag-label">Tag ${l2Block.tag}</span>
                                <div class="indicators">
                                    <span class="indicator ${l2Block.dirty ? 'on' : ''}" style="background:${l2Block.dirty ? '#e17055' : 'rgba(255,255,255,0.15)'}"></span>
                                </div>
                            </div>
                            <div class="block-data">${payload}</div>
                            <div class="block-meta">${l2Block.dirty ? 'Dirty' : 'Clean'}</div>
                        `;
                    } else {
                        block.classList.add('empty');
                        block.classList.remove('valid');
                        block.innerHTML = `
                            <div class="block-header">
                                <span class="tag-label">EMPTY</span>
                                <div class="indicators">
                                    <span class="indicator"></span>
                                </div>
                            </div>
                            <div class="block-data">-</div>
                            <div class="block-meta">Evicted</div>
                        `;
                    }
                }
            }
        }
    },

    runAll() {
        try {
            this.initSimulator();
            if (this.steps.length === 0) {
                alert("No address trace to run! Please check the input.");
                return;
            }

            // Performance: Don't animate every step in Run All
            const wasAnimating = true; // We could disable animation here if we had a flag

            // Use recursive run for dynamic speed
            this.isPlaying = true;
            this.runStepRecursive();

        } catch (e) {
            console.error("Simulation Error:", e);
            alert("Simulation error: " + e.message);
        }
    },

    runStepRecursive() {
        if (!this.isPlaying || this.stepIndex >= this.steps.length) {
            this.isPlaying = false;
            return;
        }

        this.processStep();

        // Update Scrubber
        const scrubber = document.getElementById('timelineScrubber');
        if (scrubber) scrubber.value = this.stepIndex;
        document.getElementById('currentStepDisplay').textContent = this.stepIndex;

        // Dynamic Delay
        const speedSlider = document.getElementById('speedSlider');
        const delay = speedSlider ? parseInt(speedSlider.value) : 1000;

        setTimeout(() => this.runStepRecursive(), delay);
    },

    initPlaybackControls() {
        const scrubber = document.getElementById('timelineScrubber');
        const speedSlider = document.getElementById('speedSlider');
        const speedDisplay = document.getElementById('speedDisplay');

        if (scrubber) {
            scrubber.addEventListener('input', (e) => {
                const step = parseInt(e.target.value);
                this.goToStep(step);
            });
        }

        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                speedDisplay.textContent = (val / 1000).toFixed(1) + 's';
            });
            speedDisplay.textContent = (parseInt(speedSlider.value) / 1000).toFixed(1) + 's';
        }
    },

    goToStep(targetStep) {
        if (!this.sim) this.initSimulator();

        // Clamp
        if (targetStep < 0) targetStep = 0;
        if (targetStep > this.steps.length) targetStep = this.steps.length;

        // If going backward, reset first
        if (targetStep < this.stepIndex) {
            this.reset();
            this.initSimulator(); // Re-init after reset
        }

        // Fast forward to target
        // We use batch mode for all steps except the last one to save performance
        while (this.stepIndex < targetStep) {
            const isLast = (this.stepIndex === targetStep - 1);
            this.processStep(!isLast); // Batch mode unless it's the last step
        }

        // Update UI
        document.getElementById('currentStepDisplay').textContent = this.stepIndex;
        if (document.getElementById('timelineScrubber')) {
            document.getElementById('timelineScrubber').value = this.stepIndex;
        }
    },

    step() {
        if (!this.sim) {
            this.initSimulator();
        }
        if (this.stepIndex < this.steps.length) {
            this.processStep();
            const table = document.querySelector('.table-responsive');
            table.scrollTop = table.scrollHeight;
        } else {
            alert("Simulation complete!");
        }
    },

    processStep(isBatch = false) {
        if (this.stepIndex >= this.steps.length) return;

        const stepData = this.steps[this.stepIndex];
        const addr = stepData.address;
        const type = stepData.type;
        const value = stepData.value;

        let res;
        if (type === 'Write') {
            res = this.sim.access(addr, 'Write', value);
        } else {
            res = this.sim.access(addr, 'Read');
        }

        if (!res) {
            console.error("Simulation access failed for address:", addr);
            return;
        }

        this.addLogEntry(this.stepIndex + 1, stepData.label || '0x' + addr.toString(16), res);

        // In batch mode, we might skip some visual updates for speed, 
        // but for now let's keep them to ensure "it works" visibly.
        // Maybe skip animation in batch.
        if (!isBatch) {
            this.updateMetrics(this.sim, res);
            this.updateVisualGrid(res);
            this.animateDataFlow(res);
        } else {
            // Only update metrics occasionally or at end? 
            // For small traces, updating every time is fine.
            // Let's just skip animation.
            this.updateMetrics(this.sim, res);
            this.updateVisualGrid(res);
        }

        // Context aware bot (reduce frequency in batch)
        if (!isBatch && res.missType === 'Conflict' && Math.random() > 0.7) {
            window.askBot("What is a conflict miss?");
        }

        this.stepIndex++;
    },

    getConfig() {
        return {
            cacheSize: parseInt(document.getElementById('cacheSize').value),
            blockSize: parseInt(document.getElementById('blockSize').value),
            associativity: parseInt(document.getElementById('associativity').value),
            replacementPolicy: document.getElementById('replacementPolicy').value,
            powerParams: {
                staticPower: parseFloat(document.getElementById('staticPower').value),
                missPenaltyPower: 20
            },
            voltage: parseFloat(document.getElementById('voltage').value)
        };
    },

    addLogEntry(step, addr, res) {
        const row = document.createElement('tr');
        const location = `Set ${res.setIndex}, Way ${res.wayIndex}`;
        row.innerHTML = `
            <td>${step}</td>
            <td>${addr}</td>
            <td><span class="${res.isHit ? 'success-text' : 'danger-text'}">${res.isHit ? 'Hit' : 'Miss (' + res.missType + ')'}</span></td>
            <td>${location}</td>
            <td>${res.tag}</td>
            <td>${res.energy.toFixed(2)}</td>
        `;
        document.querySelector('#resultsTable tbody').appendChild(row);
    },

    updateMetrics(sim, res) {
        const hitRate = sim.stats.accesses > 0 ? (sim.stats.hits / sim.stats.accesses * 100) : 0;

        document.getElementById('hitRateValue').textContent = hitRate.toFixed(1) + '%';
        document.getElementById('energyValue').textContent = sim.powerStats.totalEnergy.toFixed(0) + ' pJ';
        document.getElementById('accessesValue').textContent = sim.stats.accesses;
        document.getElementById('hitsValue').textContent = sim.stats.hits + ' Hits';
        document.getElementById('missesValue').textContent = sim.stats.misses + ' Misses';
        const l2HitsEl = document.getElementById('l2HitsValue');
        const l2MissesEl = document.getElementById('l2MissesValue');
        if (l2HitsEl && sim.l2) l2HitsEl.textContent = sim.l2.hits || 0;
        if (l2MissesEl && sim.l2) l2MissesEl.textContent = sim.l2.misses || 0;

        // AMAT Calculation
        // Assumptions: Hit Time = 1 cycle, Miss Penalty = 100 cycles
        const hitTime = 1;
        const missPenalty = 100;
        const missRate = sim.stats.accesses > 0 ? (sim.stats.misses / sim.stats.accesses) : 0;
        const amat = hitTime + (missRate * missPenalty);
        document.getElementById('amatValue').textContent = amat.toFixed(2) + ' cycles';

        // Avg Power (Energy per Access)
        const avgPower = sim.stats.accesses > 0 ? (sim.powerStats.totalEnergy / sim.stats.accesses) : 0;
        const avgPowerEl = document.getElementById('avgPowerValue');
        if (avgPowerEl) avgPowerEl.textContent = avgPower.toFixed(2) + ' pJ/op';

        // Record series for charts
        this.recordSeries(hitRate, res ? res.energy : 0);

        // Update Charts
        this.updateCharts(res);

        this.currentSimData = sim;
        const activeTabBtn = document.querySelector('.tab-btn.active');
        const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'grid';
        if (activeTab !== 'grid' && activeTab !== 'movement') {
            this.updateMainChart(activeTab);
        }
    },

    recordSeries(hitRate, energy) {
        const label = `S${this.stepIndex + 1}`;
        const maxPoints = 40;
        const trim = (arr) => {
            if (arr.length > maxPoints) arr.shift();
        };

        this.timelineData.labels.push(label);
        this.timelineData.hitRate.push(parseFloat(hitRate.toFixed(2)));
        this.timelineData.energy.push(parseFloat(energy.toFixed(2)));

        this.energySeries.labels.push(label);
        this.energySeries.static.push(this.sim.powerStats.staticEnergy);
        this.energySeries.dynamic.push(this.sim.powerStats.dynamicEnergy);
        this.energySeries.penalty.push(this.sim.powerStats.missPenaltyEnergy);

        [this.timelineData.labels, this.timelineData.hitRate, this.timelineData.energy,
        this.energySeries.labels, this.energySeries.static, this.energySeries.dynamic, this.energySeries.penalty].forEach(trim);
    },

    updateMainChart(type) {
        if (!this.currentSimData || !this.charts.tab) return;
        const sim = this.currentSimData;
        const chart = this.charts.tab;

        if (type === 'power') {
            chart.config.type = 'bar';
            chart.data.labels = ['Static', 'Dynamic', 'Penalty'];
            chart.data.datasets = [{
                type: 'bar',
                label: 'Energy (pJ)',
                data: [sim.powerStats.staticEnergy, sim.powerStats.dynamicEnergy, sim.powerStats.missPenaltyEnergy],
                backgroundColor: ['#5dade2', '#fdcb6e', '#e17055'],
                borderRadius: 8
            }];
        } else {
            chart.config.type = 'bar';
            chart.data.labels = ['Compulsory', 'Capacity', 'Conflict'];
            chart.data.datasets = [{
                label: 'Miss Count',
                data: [sim.stats.compulsoryMisses, sim.stats.capacityMisses, sim.stats.conflictMisses],
                backgroundColor: ['#a29bfe', '#e17055', '#d63031'],
                borderRadius: 8
            }];
        }
        chart.update();
    },

    reset() {
        this.sim = null;
        this.stepIndex = 0;
        this.timelineData = { labels: [], hitRate: [], energy: [] };
        this.energySeries = { labels: [], static: [], dynamic: [], penalty: [] };
        document.querySelector('#resultsTable tbody').innerHTML = '';
        document.getElementById('hitRateValue').textContent = '0%';
        document.getElementById('energyValue').textContent = '0 pJ';
        document.getElementById('accessesValue').textContent = '0';
        document.getElementById('hitsValue').textContent = '0 Hits';
        document.getElementById('missesValue').textContent = '0 Misses';
        document.getElementById('amatValue').textContent = '0 cycles';
        const avgPowerEl = document.getElementById('avgPowerValue');
        if (avgPowerEl) avgPowerEl.textContent = '0 pJ/op';
        const l2HitsEl = document.getElementById('l2HitsValue');
        const l2MissesEl = document.getElementById('l2MissesValue');
        if (l2HitsEl) l2HitsEl.textContent = '0';
        if (l2MissesEl) l2MissesEl.textContent = '0';

        // Reset Scrubber
        const scrubber = document.getElementById('timelineScrubber');
        if (scrubber) {
            scrubber.value = 0;
            scrubber.disabled = true;
        }
        document.getElementById('currentStepDisplay').textContent = '0';
        document.getElementById('totalStepsDisplay').textContent = '0';

        // Clear Grid
        const container = document.getElementById('visualGrid');
        container.innerHTML = '<div class="empty-state">Run simulation to see cache state</div>';

        // Reset Charts
        if (this.charts.hitMissPie) {
            this.charts.hitMissPie.data.datasets[0].data = [0, 0];
            this.charts.hitMissPie.update();
        }
        if (this.charts.accessBar) {
            this.charts.accessBar.data.datasets[0].data = [0, 0];
            this.charts.accessBar.update();
        }
        if (this.charts.amat) {
            this.charts.amat.data.labels = [];
            this.charts.amat.data.datasets[0].data = [];
            this.charts.amat.update();
        }
        if (this.charts.energyBar) {
            this.charts.energyBar.data.datasets[0].data = [0, 0, 0];
            this.charts.energyBar.update();
        }
        if (this.charts.timeline) {
            this.charts.timeline.data.labels = [];
            this.charts.timeline.data.datasets.forEach(ds => ds.data = []);
            this.charts.timeline.update();
        }
        if (this.charts.powerStacked) {
            this.charts.powerStacked.data.labels = [];
            this.charts.powerStacked.data.datasets.forEach(ds => ds.data = []);
            this.charts.powerStacked.update();
        }
        if (this.charts.tab) {
            this.charts.tab.data.datasets.forEach(ds => ds.data = []);
            this.charts.tab.update();
        }
    },

    showToast(msg) {
        // Simple toast implementation
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--accent-color);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    },

    setupTooltips() {
        const tooltips = {
            config: {
                title: 'Cache Configuration',
                formula: 'Size = Sets × Ways × BlockSize',
                desc: 'Configure the physical parameters of the cache memory.',
                factors: ['Larger cache = Higher hit rate but more power']
            },
            hitRate: {
                title: 'Hit Rate',
                formula: 'Hit Rate = (Hits / Total Accesses) × 100%',
                desc: 'The percentage of memory accesses found in the cache.',
                factors: ['Associativity', 'Block Size', 'Locality']
            },
            energy: {
                title: 'Total Energy',
                formula: 'E_total = E_static + E_dynamic',
                desc: 'Total energy consumed during the simulation.',
                factors: ['Voltage', 'Access Count', 'Tech Node']
            }
        };

        const overlay = document.getElementById('tooltipOverlay');
        const title = document.getElementById('tooltipTitle');
        const formula = document.getElementById('tooltipFormula');
        const desc = document.getElementById('tooltipDesc');
        const factors = document.getElementById('tooltipFactors');

        document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
            trigger.addEventListener('mouseenter', (e) => {
                const key = e.target.dataset.tooltip;
                const data = tooltips[key];
                if (data) {
                    title.textContent = data.title;
                    formula.textContent = data.formula;
                    desc.textContent = data.desc;
                    factors.innerHTML = data.factors.map(f => `<div>• ${f}</div>`).join('');
                    overlay.classList.remove('hidden');
                }
            });

            trigger.addEventListener('mouseleave', () => {
                overlay.classList.add('hidden');
            });
        });
    },

    initHelpSystem() {
        const helpContent = {
            'config': {
                title: 'Cache Configuration',
                formula: 'Size = Sets × Ways × BlockSize',
                desc: 'Configure the geometry of the cache. Changing these values affects the Hit Rate and Energy consumption.',
                factors: ['Cache Size: Total capacity', 'Block Size: Data chunk size', 'Associativity: Ways per set']
            },
            'hitRate': {
                title: 'Hit Rate',
                formula: 'Hit Rate = Hits / Total Accesses',
                desc: 'The percentage of memory accesses found in the cache. A higher hit rate means better performance.',
                factors: ['Capacity Misses: Cache too small', 'Conflict Misses: Set full', 'Compulsory Misses: First access']
            },
            'energy': {
                title: 'Energy Consumption',
                formula: 'E = (E_tag + E_data) × V²',
                desc: 'Total energy consumed by cache operations. Includes dynamic power (switching) and static power (leakage).',
                factors: ['Voltage (V): Quadratic impact', 'Associativity: More tag checks', 'Size: More leakage']
            },
            'amat': {
                title: 'AMAT',
                formula: 'Hit Time + (Miss Rate × Miss Penalty)',
                desc: 'Average Memory Access Time. The average time it takes to fetch data.',
                factors: ['Hit Time: L1 access latency', 'Miss Penalty: Time to fetch from RAM']
            }
        };

        const overlay = document.getElementById('tooltipOverlay');
        const title = document.getElementById('tooltipTitle');
        const formula = document.getElementById('tooltipFormula');
        const desc = document.getElementById('tooltipDesc');
        const factors = document.getElementById('tooltipFactors');

        if (!overlay) return;

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });

        document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = trigger.dataset.tooltip;
                const data = helpContent[key];

                if (data) {
                    title.textContent = data.title;
                    formula.textContent = data.formula;
                    desc.textContent = data.desc;

                    factors.innerHTML = '';
                    data.factors.forEach(f => {
                        const div = document.createElement('div');
                        div.className = 'factor-tag';
                        div.textContent = f;
                        factors.appendChild(div);
                    });

                    overlay.classList.remove('hidden');
                }
            });
        });
    },

    initEventListeners() {
        // Helper to safely add listener
        const addListener = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
            else console.warn(`Element with ID '${id}' not found.`);
        };

        // Theme Toggle
        addListener('themeToggle', 'click', () => this.toggleTheme());

        // Auth
        addListener('loginBtn', 'click', () => this.handleLogin());
        addListener('logoutBtn', 'click', () => this.handleLogout());

        // Theory
        // Theory (Handled by link to theory.html)


        // Simulation Controls
        addListener('runSimulation', 'click', () => this.runAll());
        addListener('stepSimulation', 'click', () => this.step());
        addListener('playSimulation', 'click', () => this.togglePlay());
        addListener('resetSimulation', 'click', () => this.reset());

        // Trace Examples
        addListener('traceExample', 'change', (e) => this.loadTrace(e.target.value));

        // Grid Zoom
        const zoomInput = document.getElementById('gridZoom');
        if (zoomInput) {
            zoomInput.addEventListener('input', (e) => {
                const scale = e.target.value;
                const grid = document.getElementById('visualGrid');
                if (grid) {
                    grid.style.fontSize = `${0.8 * scale}rem`;
                    grid.style.gap = `${12 * scale}px`;
                    document.querySelectorAll('.cache-block').forEach(b => {
                        b.style.height = `${70 * scale}px`;
                        b.style.minWidth = `${40 * scale}px`;
                    });
                }
            });
        }

        // Config Change -> Auto Reset
        const configInputs = ['cacheSize', 'blockSize', 'associativity', 'replacementPolicy', 'staticPower', 'voltage'];
        configInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', (e) => {
                    const display = document.getElementById(id + 'Display');
                    if (display) display.textContent = e.target.value;
                    if (this.resetTimeout) clearTimeout(this.resetTimeout);
                    this.resetTimeout = setTimeout(() => {
                        this.reset();
                        this.showToast("Configuration changed. Simulation reset.");
                    }, 300);
                });
            }
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const tab = e.target.dataset.tab;

                if (tab === 'grid') {
                    const grid = document.getElementById('visualGrid');
                    if (grid) grid.classList.remove('hidden');
                    const chart = document.getElementById('chartContainer');
                    if (chart) chart.classList.add('hidden');
                    const move = document.getElementById('dataMovement');
                    if (move) move.classList.add('hidden');
                } else if (tab === 'movement') {
                    const grid = document.getElementById('visualGrid');
                    if (grid) grid.classList.add('hidden');
                    const chart = document.getElementById('chartContainer');
                    if (chart) chart.classList.add('hidden');
                    const move = document.getElementById('dataMovement');
                    if (move) move.classList.remove('hidden');
                } else {
                    const grid = document.getElementById('visualGrid');
                    if (grid) grid.classList.add('hidden');
                    const chart = document.getElementById('chartContainer');
                    if (chart) chart.classList.remove('hidden');
                    const move = document.getElementById('dataMovement');
                    if (move) move.classList.add('hidden');
                    this.updateMainChart(tab);
                }
            });
        });
    },

    initChatbot() {
        const widget = document.getElementById('chatbotWidget');
        const trigger = document.getElementById('chatTrigger');
        const closeBtn = document.getElementById('closeChat');
        const sendBtn = document.getElementById('sendMessage');
        const input = document.getElementById('chatInput');

        // Settings
        const settingsBtn = document.getElementById('chatSettingsBtn');
        const settingsPanel = document.getElementById('chatSettingsPanel');
        const saveKeyBtn = document.getElementById('saveKeyBtn');
        const keyInput = document.getElementById('geminiKey');

        // Load Key
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) keyInput.value = savedKey;

        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
        });

        saveKeyBtn.addEventListener('click', () => {
            const key = keyInput.value.trim();

            if (key) {
                localStorage.setItem('gemini_api_key', key);
                this.addChatMessage(`Settings saved! Powered by Gemini 2.0 Flash ⚡`, 'bot');
                settingsPanel.classList.add('hidden');
            }
        });

        trigger.addEventListener('click', () => {
            widget.classList.remove('closed');
            trigger.style.transform = 'scale(0)';
        });

        closeBtn.addEventListener('click', () => {
            widget.classList.add('closed');
            trigger.style.transform = 'scale(1)';
        });

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            this.addChatMessage(text, 'user');
            input.value = '';

            // Show typing indicator
            const typingId = this.addChatMessage("Thinking...", 'bot', true);

            try {
                const response = await this.getBotResponse(text);
                // Remove typing indicator (by replacing or removing)
                const typingMsg = document.getElementById(typingId);
                if (typingMsg) typingMsg.remove();

                this.addChatMessage(response, 'bot');
            } catch (e) {
                console.error(e);
                const typingMsg = document.getElementById(typingId);
                if (typingMsg) typingMsg.remove();
                this.addChatMessage("Sorry, I encountered an error. " + e.message, 'bot');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Quick Questions
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                input.value = chip.textContent;
                sendMessage();
            });
        });

        // Expose askBot globally
        window.askBot = (question) => {
            if (widget.classList.contains('closed')) {
                widget.classList.remove('closed');
                trigger.style.transform = 'scale(0)';
            }
            input.value = question;
            sendMessage();
        };
    },

    async getBotResponse(input) {
        const apiKey = localStorage.getItem('gemini_api_key');

        // If no API key, use fallback regex bot
        if (!apiKey) {
            return this.getLocalBotResponse(input);
        }

        // Call Gemini API
        try {
            const response = await this.callGeminiAPI(input, apiKey);
            return response;
        } catch (error) {
            console.warn("Gemini API failed, falling back to local bot:", error);
            return this.getLocalBotResponse(input) + `\n\n(⚠️ API Error: ${error.message})`;
        }
    },

    async callGeminiAPI(prompt, apiKey) {
        // Hardcoded to Gemini 2.0 Flash as requested
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const systemContext = `
            You are TUMmy, an expert AI tutor for the Technical University of Munich (TUM) students.
            Your domain is STRICTLY Computer Architecture, specifically RISC-V and Cache Memories.
            
            Current Simulation State:
            - Cache Size: ${this.sim ? this.sim.cacheSize : 'Unknown'} Bytes
            - Block Size: ${this.sim ? this.sim.blockSize : 'Unknown'} Bytes
            - Associativity: ${this.sim ? this.sim.associativity : 'Unknown'}
            - Replacement Policy: ${this.sim ? this.sim.replacementPolicy : 'Unknown'}
            
            Rules:
            1. Answer ONLY questions related to Computer Architecture, Caches, RISC-V, or the simulation.
            2. If asked about general topics (weather, history, etc.), politely decline and steer back to caches.
            3. Be concise and educational. Use emojis occasionally.
            4. Explain concepts simply, as if to a student.
        `;

        const payload = {
            contents: [{
                parts: [{
                    text: systemContext + "\n\nUser Question: " + prompt
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    },

    getLocalBotResponse(input) {
        const lower = input.toLowerCase();
        if (lower.includes('hit') || lower.includes('miss')) {
            return "A **Hit** means data was found in the cache (fast!). A **Miss** means we had to go to main memory (slow). Types of misses: Compulsory (first access), Capacity (full), Conflict (set full).";
        }
        if (lower.includes('associativity')) {
            return "**Associativity** determines how many specific places a block can go. Direct Mapped = 1 place. Fully Associative = Any place. N-way = N places.";
        }
        if (lower.includes('risc-v') || lower.includes('risc')) {
            return "RISC-V is an open standard Instruction Set Architecture (ISA). This simulator mimics how a RISC-V processor would interact with memory.";
        }
        if (lower.includes('hello') || lower.includes('hi')) {
            return "Hello! I am TUMmy 🤖. Ask me about Caches, RISC-V, or this simulation!";
        }
        return "I'm not sure about that. Try asking about 'Hit Rate', 'Associativity', or 'RISC-V'. (Add an API Key in settings for smarter answers!)";
    },

    addChatMessage(text, sender, isTyping = false) {
        const body = document.getElementById('chatBody');
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        if (isTyping) {
            div.id = 'typing-' + Date.now();
            div.style.fontStyle = 'italic';
            div.style.opacity = '0.7';
        }
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        return div.id;
    },

    animateDataFlow(res) {
        // Create a particle element for animation
        const particle = document.createElement('div');
        particle.className = 'data-particle';
        // Styles are now in CSS for better performance and maintainability
        document.body.appendChild(particle);

        // Define positions
        // We target the System View components
        const cpuEl = document.querySelector('.sys-component.cpu-unit');
        const l1El = document.querySelector('.sys-component.l1-cache');
        const l2El = document.querySelector('.sys-component.l2-cache');
        const ramEl = document.querySelector('.sys-component.ram-unit');
        const busL1 = document.querySelector('.sys-bus.bus-l1');
        const busL2 = document.querySelector('.sys-bus.bus-l2');
        const busRam = document.querySelector('.sys-bus.bus-ram');

        // Fallback to main containers if system view is hidden (though system view is usually visible)
        // or if we are in a specific view.
        // Ideally, we should detect which view is active.
        // For now, let's prioritize the System View elements as they show the flow best.

        if (!cpuEl || !l1El) {
            particle.remove();
            return;
        }

        const getCenter = (el) => {
            const rect = el.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        };

        const pulse = (el) => {
            if (!el) return;
            el.classList.add('glow-loop');
            setTimeout(() => el.classList.remove('glow-loop'), 1200);
        };

        const activateBus = (busEl) => {
            if (!busEl) return;
            busEl.classList.add('active');
            setTimeout(() => busEl.classList.remove('active'), 950);
        };

        const cpuPos = getCenter(cpuEl);
        const l1Pos = getCenter(l1El);
        const l2Pos = l2El ? getCenter(l2El) : { x: l1Pos.x + 200, y: l1Pos.y }; // Fallback
        const ramPos = ramEl ? getCenter(ramEl) : { x: l1Pos.x + 400, y: l1Pos.y }; // Fallback

        // Animation Sequence (Slower: 1s per hop)
        // Initial Position
        if (res.isHit) {
            // Hit: L1 -> CPU
            particle.style.left = `${l1Pos.x}px`;
            particle.style.top = `${l1Pos.y}px`;
            activateBus(busL1);
            pulse(l1El);

            requestAnimationFrame(() => {
                particle.style.left = `${cpuPos.x}px`;
                particle.style.top = `${cpuPos.y}px`;
                pulse(cpuEl);
            });
        } else if (res.l2Hit) {
            // L2 Hit: L2 -> L1 -> CPU
            particle.style.left = `${l2Pos.x}px`;
            particle.style.top = `${l2Pos.y}px`;
            activateBus(busL2);
            pulse(l2El);

            requestAnimationFrame(() => {
                particle.style.left = `${l1Pos.x}px`;
                particle.style.top = `${l1Pos.y}px`;
                pulse(l1El);

                setTimeout(() => {
                    particle.style.left = `${cpuPos.x}px`;
                    particle.style.top = `${cpuPos.y}px`;
                    pulse(cpuEl);
                    activateBus(busL1);
                }, 1000); // 1s delay
            });
        } else {
            // Miss: RAM -> L2 -> L1 -> CPU
            particle.style.left = `${ramPos.x}px`;
            particle.style.top = `${ramPos.y}px`;
            activateBus(busRam);
            pulse(ramEl);

            requestAnimationFrame(() => {
                particle.style.left = `${l2Pos.x}px`;
                particle.style.top = `${l2Pos.y}px`;
                pulse(l2El);
                activateBus(busL2);

                setTimeout(() => {
                    particle.style.left = `${l1Pos.x}px`;
                    particle.style.top = `${l1Pos.y}px`;
                    pulse(l1El);
                    activateBus(busL1);

                    setTimeout(() => {
                        particle.style.left = `${cpuPos.x}px`;
                        particle.style.top = `${cpuPos.y}px`;
                        pulse(cpuEl);
                    }, 1000); // 1s delay
                }, 1000); // 1s delay
            });
        }

        // Cleanup
        setTimeout(() => particle.remove(), 3500);
    },
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
