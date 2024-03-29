import { type LinksFunction } from "@remix-run/node";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import {
  EditorProvider,
  // FloatingMenu,
  // BubbleMenu,
  type EditorProviderProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "~/lib/utils";
import styles from "./main.css";
import { SuggestionCommand } from "./slash-menu";
import { suggestions } from "./slash-menu/suggestions";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css",
  },
];

// define your extension array
const extensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "not-prose",
    },
  }),
  SuggestionCommand.configure({
    // @ts-ignore
    suggestion: suggestions,
  }),
  TiptapLink.configure({}),

  CodeBlockLowlight.configure({
    lowlight,
    languageClassPrefix: "language-",
  }),
];

interface RichTextEditorProps {
  defaultContent?: string;
  disabled?: boolean;
  placeholder?: string;
  customExtentions?: typeof extensions;

  className?: React.HTMLAttributes<HTMLDivElement>["className"];
  //
  onChange?: EditorProviderProps["onUpdate"];
  onBlur?: EditorProviderProps["onBlur"];
}

export const RichTextEditor = (props: RichTextEditorProps) => {
  return (
    <EditorProvider
      extensions={[
        Placeholder.configure({
          emptyEditorClass: "is-editor-empty",
          placeholder: props.placeholder ?? "Press '/' for commands.",
        }),
        ...extensions,
        ...(props.customExtentions ?? []),
      ]}
      editable={!props.disabled ?? true}
      content={props.defaultContent}
      onUpdate={(editor) => {
        props?.onChange?.(editor);
      }}
      onBlur={(editor) => {
        props?.onBlur?.(editor);
      }}
      editorProps={{
        attributes(state) {
          return {
            class: cn(
              `tiptap ProseMirror tiptap-editor prose dark:prose-invert max-w-[unset] ${
                props.className ?? ""
              }`.trim(),
            ),
          };
        },
      }}
    >
      {/* <FloatingMenu>This is the floating menu</FloatingMenu> */}
      {/* <BubbleMenu>This is the bubble menu</BubbleMenu> */}
    </EditorProvider>
  );
};
