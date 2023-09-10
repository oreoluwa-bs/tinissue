import { ReactRenderer, type Editor, type Range } from "@tiptap/react";
import {
  CheckSquareIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrderedIcon,
  TextIcon,
  TextQuoteIcon,
} from "lucide-react";
// import { Loader2Icon } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import tippy from "tippy.js";
import { cn } from "~/lib/utils";

interface CommandProps {
  editor: Editor;
  range: Range;
}

const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    // {
    //   title: "Continue writing",
    //   description: "Use AI to expand your thoughts.",
    //   searchTerms: ["gpt"],
    //   // icon: <Magic className="w-7" />,
    // },
    // {
    //   title: "Send Feedback",
    //   description: "Let us know how we can improve.",
    //   // icon: <MessageSquarePlus size={18} />,
    //   command: ({ editor, range }: CommandProps) => {
    //     editor.chain().focus().deleteRange(range).run();
    //     window.open("/feedback", "_blank");
    //   },
    // },
    {
      title: "Text",
      description: "Just start typing with plain text.",
      searchTerms: ["p", "paragraph"],
      icon: <TextIcon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
    },
    {
      title: "To-do List",
      description: "Track tasks with a to-do list.",
      searchTerms: ["todo", "task", "list", "check", "checkbox"],
      icon: <CheckSquareIcon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      searchTerms: ["title", "big", "large"],
      icon: <Heading1Icon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      searchTerms: ["subtitle", "medium"],
      icon: <Heading2Icon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      searchTerms: ["subtitle", "small"],
      icon: <Heading3Icon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a simple bullet list.",
      searchTerms: ["unordered", "point"],
      icon: <ListIcon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      searchTerms: ["ordered"],
      icon: <ListOrderedIcon size={18} />,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote.",
      searchTerms: ["blockquote"],
      icon: <TextQuoteIcon size={18} />,
      command: ({ editor, range }: CommandProps) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .toggleBlockquote()
          .run(),
    },
    {
      title: "Code",
      description: "Capture a code snippet.",
      searchTerms: ["codeblock"],
      icon: <Code2Icon size={18} />,
      command: ({ editor, range }: CommandProps) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    //   {
    //     title: "Image",
    //     description: "Upload an image from your computer.",
    //     searchTerms: ["photo", "picture", "media"],
    //     icon: <ImageIcon size={18} />,
    //     command: ({ editor, range }: CommandProps) => {
    //       editor.chain().focus().deleteRange(range).run();
    //       // upload image
    //       const input = document.createElement("input");
    //       input.type = "file";
    //       input.accept = "image/*";
    //       input.onchange = async () => {
    //         if (input.files?.length) {
    //           const file = input.files[0];
    //           const pos = editor.view.state.selection.from;
    //           startImageUpload(file, editor.view, pos);
    //         }
    //       };
    //       input.click();
    //     },
    //   },
  ].filter((item) => {
    if (typeof query === "string" && query.length > 0) {
      const search = query.toLowerCase();
      return (
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.searchTerms &&
          item.searchTerms.some((term: string) => term.includes(search)))
      );
    }
    return true;
  });
};

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: any | null = null;

  return {
    onStart: (props: { editor: Editor; clientRect: DOMRect }) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
        // @ts-ignore
      });

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect as any,
        appendTo: () => document.body,
        content: component.element as any,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect: DOMRect }) => {
      component?.updateProps(props);
      popup[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup[0].hide();

        return true;
      }

      // @ts-ignore
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const suggestions = {
  items: getSuggestionItems,
  render: renderItems,
};

interface CommandItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export const updateScrollView = (container: HTMLElement, item: HTMLElement) => {
  const containerHeight = container.offsetHeight;
  const itemHeight = item ? item.offsetHeight : 0;

  const top = item.offsetTop;
  const bottom = top + itemHeight;

  if (top < container.scrollTop) {
    container.scrollTop -= container.scrollTop - top + 5;
  } else if (bottom > containerHeight + container.scrollTop) {
    container.scrollTop += bottom - containerHeight - container.scrollTop + 5;
  }
};

function CommandList({
  items,
  command,
  editor,
  range,
}: {
  items: CommandItemProps[];
  command: any;
  editor: any;
  range: any;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];

      if (item) {
        command(item);
      }
    },
    [command, items],
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];

    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (e.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (e.key === "Enter") {
          selectItem(selectedIndex);
          e.stopPropagation();
          e.preventDefault();
          return true;
        }
        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [items, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const commandListContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;

    const item = container?.children[selectedIndex] as HTMLElement;

    if (item && container) updateScrollView(container, item);
  }, [selectedIndex]);

  return items.length > 0 ? (
    <div
      id="slash-command"
      ref={commandListContainer}
      className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-border bg-background px-1 py-2 shadow-md transition-all"
    >
      {items.map((item: CommandItemProps, index: number) => {
        return (
          <button
            className={cn(
              `flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground`,
              index === selectedIndex && "bg-accent text-accent-foreground",
            )}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-stone-500">{item.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  ) : null;
}
