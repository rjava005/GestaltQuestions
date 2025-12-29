import { useState, useEffect } from "react";

// Markdown Parsing
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

// UI Components
import SectionContainer from "../../components/Section/Section";
import MarkDownEditor from "../../components/markdownEditor/MarkdownEditor";
import QuestionHTMLToReact from "../QuestionComponents/ParseQuestionHTML";
import { visit } from "unist-util-visit";
// Layout
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Styles
import "./gestalt_studio.css";


export function rehypeCustomBlocks() {
    return (tree: any) => {
        visit(tree, "element", (node: any) => {
            if (node.tagName?.startsWith("pl-")) {
                // mark as block-level element
                node.data = node.data || {};
                node.data.hName = node.tagName;
                node.data.hProperties = node.properties || {};
                node.data.isBlock = true;
            }
        });
    };
}

export default function GestaltStudio() {
    const [content, setContent] = useState<string>("");
    const [html, setHtml] = useState<string>("");

    useEffect(() => {
        async function convertMarkdown() {
            try {
                const file = await unified()
                    .use(remarkParse)
                    .use(remarkGfm)
                    .use(remarkRehype, { allowDangerousHtml: true })
                    .use(rehypeStringify, { allowDangerousHtml: true })
                    .use(rehypeCustomBlocks)
                    .process(content);

                setHtml(String(file.value));
            } catch (err) {
                console.error("Markdown conversion error:", err);
                setHtml("<p>Error parsing markdown.</p>");
            }
        }

        convertMarkdown();
    }, [content]);

    return (
        <SectionContainer id="gestalt-studio" className="min-h-screen">
            <PanelGroup autoSaveId="gestalt-studio-panels" direction="horizontal">

                {/* Markdown Editor */}
                <Panel defaultSize={25}>
                    <div className="border-3 border-b">
                        <MarkDownEditor
                            content={content}
                            setContent={setContent}
                        />
                    </div>
                </Panel>

                <PanelResizeHandle />

                {/* Rendered Output */}
                <Panel defaultSize={25}>
                    <div className="border-3 border-b">
                        <div className="gestalt-studio min-h-screen p-4">
                            <QuestionHTMLToReact html={html} />
                        </div>
                    </div>
                </Panel>

            </PanelGroup>
        </SectionContainer>
    );
}