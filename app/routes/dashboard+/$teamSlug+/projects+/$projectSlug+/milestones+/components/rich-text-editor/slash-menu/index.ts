import { Extension } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

export const SuggestionCommand = Extension.create<{
  suggestion: Partial<SuggestionOptions>;
}>({
  name: "suggestions",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          props.command?.({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        // @ts-ignore
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
