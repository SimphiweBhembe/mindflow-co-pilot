import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-3 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border [&_td]:py-2 [&_td]:pr-3 [&_blockquote]:rounded-lg [&_blockquote]:border-l-4 [&_blockquote]:border-warning [&_blockquote]:bg-warning/10 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-xs [&_a]:text-primary [&_a]:underline">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          pre: ({ children, node }) => {
            const code = (node?.children?.[0] as { children?: { value?: string }[] })?.children?.[0]?.value ?? "";
            return (
              <div className="group relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Code copied");
                  }}
                  className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 transition group-hover:opacity-100"
                  aria-label="Copy code"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <pre className="overflow-x-auto rounded-xl bg-muted p-4 font-mono text-xs">{children}</pre>
              </div>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
