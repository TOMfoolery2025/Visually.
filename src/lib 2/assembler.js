export function assemble(code) {
    const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    const trace = [];
    const labels = {};
    const registers = new Array(8).fill(0);
    const memory = {}; // Simulation-time memory for logic

    // First pass: Find labels
    let pc = 0;
    const instructions = [];

    for (const line of lines) {
        // Remove comments
        const cleanLine = line.split('//')[0].trim();
        if (!cleanLine) continue;

        if (cleanLine.endsWith(':')) {
            const label = cleanLine.slice(0, -1);
            labels[label] = instructions.length;
        } else {
            instructions.push(cleanLine);
        }
    }

    // Second pass: Execute (Simulation of ASM to generate Memory Trace)
    // We limit execution to prevent infinite loops in browser
    let steps = 0;
    const MAX_STEPS = 1000;
    pc = 0;

    while (pc < instructions.length && steps < MAX_STEPS) {
        const line = instructions[pc];
        const parts = line.replace(/,/g, ' ').split(/\s+/);
        const op = parts[0].toUpperCase();

        // Helper to parse R1 -> 1
        const getReg = (s) => parseInt(s.replace('R', ''));
        // Helper to parse 0x100 or 100
        const getVal = (s) => s.startsWith('0x') ? parseInt(s, 16) : parseInt(s);

        switch (op) {
            case 'MOVI': // MOVI R1, 10
                registers[getReg(parts[1])] = getVal(parts[2]);
                pc++;
                break;
            case 'ADD': // ADD R1, R2, R3 (R1 = R2 + R3)
                registers[getReg(parts[1])] = registers[getReg(parts[2])] + registers[getReg(parts[3])];
                pc++;
                break;
            case 'ADDI': // ADDI R1, R2, 10 (R1 = R2 + 10)
                registers[getReg(parts[1])] = registers[getReg(parts[2])] + getVal(parts[3]);
                pc++;
                break;
            case 'LW': // LW R1, 0(R2) -> Read Address R2+0
                {
                    const regDest = getReg(parts[1]);
                    const offsetStr = parts[2]; // 0(R2)
                    const offset = parseInt(offsetStr.split('(')[0]);
                    const baseReg = getReg(offsetStr.split('(')[1].replace(')', ''));
                    const addr = registers[baseReg] + offset;

                    // Generate Trace
                    trace.push(`0x${addr.toString(16).toUpperCase()}`);

                    // Simulate value (random or 0 for now as we don't have real memory in assembler)
                    registers[regDest] = 0;
                    pc++;
                }
                break;
            case 'SW': // SW R1, 0(R2) -> Write Address R2+0
                {
                    const regSrc = getReg(parts[1]);
                    const offsetStr = parts[2];
                    const offset = parseInt(offsetStr.split('(')[0]);
                    const baseReg = getReg(offsetStr.split('(')[1].replace(')', ''));
                    const addr = registers[baseReg] + offset;
                    const val = registers[regSrc];

                    // Generate Trace
                    trace.push(`Write 0x${addr.toString(16).toUpperCase()} ${val}`);
                    pc++;
                }
                break;
            case 'BEQ': // BEQ R1, R2, LABEL
                if (registers[getReg(parts[1])] === registers[getReg(parts[2])]) {
                    const label = parts[3];
                    if (labels[label] !== undefined) {
                        pc = labels[label];
                    } else {
                        throw new Error(`Unknown label: ${label}`);
                    }
                } else {
                    pc++;
                }
                break;
            case 'JMP': // JMP LABEL
                {
                    const label = parts[1];
                    if (labels[label] !== undefined) {
                        pc = labels[label];
                    } else {
                        throw new Error(`Unknown label: ${label}`);
                    }
                }
                break;
            case 'HALT':
                pc = instructions.length; // Stop
                break;
            default:
                pc++; // Skip unknown
                break;
        }
        steps++;
    }

    if (steps >= MAX_STEPS) {
        console.warn("Assembly execution limit reached (infinite loop?)");
    }

    return trace.join('\n');
}
