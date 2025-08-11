import React, { useState } from "react";
import { Send } from "lucide-react";

export default function ChatPanel({ onIntent, disabled, tall=false, className="" }){
  const [msgs, setMsgs] = useState([
    { role:"assistant", text:"Hi! Type 'run plan' to execute the default plan or simulate from the cards above." }
  ]);
  const [text, setText] = useState("");

  async function send(e){
    e.preventDefault();
    if (!text.trim()) return;
    const m = { role:"user", text };
    setMsgs(prev=>[...prev, m]);
    setText("");
    if (onIntent) {
      const { events, response } = await onIntent(text);
      const lines = (events||[]).map(ev=>`[${ev.level}] ${ev.step||""} ${ev.msg||""}`).join("\n");
      setMsgs(prev=>[...prev, { role:"assistant", text: (response || "Processed.") + (lines? `\n\n${lines}`:"") }]);
    }
  }

  const container = `rounded-2xl border bg-white shadow-sm ${className}`;
  const scrollMax = tall ? "max-h-[40vh]" : "max-h-72";
  const minH = tall ? "min-h-[320px]" : "min-h-[200px]";

  return (
    <div className={container}>
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assistant</h2>
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <a className="underline" href="/api/docs" target="_blank" rel="noreferrer">REST docs</a>
          <a className="underline" href="/api/trpc" target="_blank" rel="noreferrer">tRPC</a>
        </div>
      </div>
      <div className={`p-4 space-y-2 overflow-auto ${scrollMax} ${minH} resize-y`}>
        {msgs.map((m,i)=> (
          <div key={i} className={m.role==="user"?"text-right":"text-left"}>
            <div className={`inline-block rounded-lg px-3 py-2 text-sm ${m.role==="user"?"bg-black text-white":"bg-gray-100"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 flex gap-2 border-t">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder='e.g., "run plan" or "price ROSE-12 today"'
               className="flex-1 border rounded-md p-2" disabled={disabled} />
        <button className="inline-flex items-center gap-2 rounded-md bg-black text-white px-3 py-2" disabled={disabled}>
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
