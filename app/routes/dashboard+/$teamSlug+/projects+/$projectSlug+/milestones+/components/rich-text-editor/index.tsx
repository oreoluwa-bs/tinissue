import { type LinksFunction } from "@remix-run/node";
import {
  EditorProvider,
  // FloatingMenu,
  // BubbleMenu,
  type EditorProviderProps,
} from "@tiptap/react";
import styles from "./main.css";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "~/lib/utils";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { SuggestionCommand } from "./slash-menu";
import { suggestions } from "./slash-menu/suggestions";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

// define your extension array
const extensions = [
  StarterKit,
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
          placeholder: props.placeholder,
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
