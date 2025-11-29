import { useState } from 'react';
import { Play, RotateCcw, Save } from 'lucide-react';
import { assemble } from '../../lib/assembler';

export function AssemblyEditor({ sim }) {
    const [code, setCode] = useState(`// Simple Loop Example
MOVI R1, 0      // i = 0
MOVI R2, 5      // limit = 5
MOVI R3, 0x1000 // Base Address

LOOP:
  BEQ R1, R2, END // if i == limit, goto END
  
  SW R1, 0(R3)    // Store i at memory[base + 0]
  LW R4, 0(R3)    // Load back to verify (Hit!)
  
  ADDI R1, R1, 1  // i++
  ADDI R3, R3, 4  // Next address
  JMP LOOP

END:
  HALT
`);

    const [error, setError] = useState(null);

    const handleRun = () => {
        try {
            setError(null);
            const trace = assemble(code);
            sim.loadTrace(trace);
            sim.setIsPlaying(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider">Assembly Editor</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleRun}
                        className="btn-primary text-xs py-1.5 px-3"
                    >
                        <Play size={14} /> Assemble & Run
                    </button>
                </div>
            </div>

            <div className="flex-1 relative group">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-full min-h-[300px] bg-[color:var(--surface-2)] text-[color:var(--text-primary)] font-mono text-sm p-4 rounded-xl border border-[color:var(--glass-border)] focus:border-[color:var(--accent-color)] focus:ring-1 focus:ring-[color:var(--accent-color)] resize-none custom-scrollbar leading-relaxed"
                    spellCheck="false"
                />
                {error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs font-mono backdrop-blur-md">
                        Error: {error}
                    </div>
                )}
            </div>

            <div className="mt-2 text-[10px] text-[color:var(--text-secondary)] font-mono flex justify-between">
                <span>Supported: LW, SW, ADD, ADDI, MOVI, BEQ, JMP, HALT</span>
                <span>Registers: R0-R7</span>
            </div>
        </div>
    );
}
