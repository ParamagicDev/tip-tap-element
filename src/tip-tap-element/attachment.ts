import { Node, mergeAttributes, Extension } from "@tiptap/core";
import {default as TipTapImage } from "@tiptap/extension-image";
import { AttachmentManager } from "../attachment-upload";
import { AttachmentEditor } from "./attachment-editor";

export interface AttachmentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachment: {
      /**
       * Add an attachment(s)
       */
      setAttachment: (options: AttachmentManager | AttachmentManager[]) => ReturnType;
    };
  }
}

export const inputRegex = /(!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\))$/;

const AttachmentImage = TipTapImage.extend({
  selectable: false,
  draggable: false,
});

const Attachment = Node.create({
  name: "attachment-figure",
  group: "block attachmentFigure",
  content: "paragraph*",
  draggable: true,
  selectable: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {
        className: "attachment attachment--preview attachment--png",
        "data-trix-attributes": JSON.stringify({presentation: "gallery"})
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure",
        contentElement: "figcaption",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const {
      // Figure
      contentType, sgid, fileName,

      // Image
      imageId, src, width, height } = HTMLAttributes
    return [
      "figure",
      mergeAttributes(this.options.HTMLAttributes, {
        // "data-attachment-id": attachmentId,
        "data-trix-content-type": contentType,
        "data-trix-attachment": JSON.stringify({
          contentType,
          filename: fileName,
          height,
          width
        }),
        sgid
      }),
      [
        "img",
        mergeAttributes({}, {
          src,
          "data-image-id": imageId,
          draggable: false,
          contenteditable: false,
        }),
      ],
      ["figcaption", 0],
    ];
  },

  addAttributes() {
    return {
      attachmentId: { default: null },
      progress: { default: null },
      imageId: { default: null },
      sgid: { default: null },
      src: { default: null },
      height: { default: null },
      width: { default: null },
      contentType: { default: null },
      fileName: { default: null },
      fileSize: { default: null },
      content: { default: null },
      url: { default: null },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const {
        attachmentId,
        contentType,
        sgid,
        fileName,
        progress,
        fileSize,
        url,
        imageId,
        src,
        width,
        height
      } = node.attrs

      const figure = document.createElement("figure");

      figure.setAttribute("data-trix-content-type", node.attrs.contentType),
      figure.setAttribute("data-trix-attachment", JSON.stringify({
        contentType,
        filename: fileName,
        height,
        width,
        sgid,
        url
      }))
      figure.setAttribute("sgid", sgid)

      const attachmentEditor = document.createElement("attachment-editor") as AttachmentEditor
      attachmentEditor.setAttribute("data-attachment-id", attachmentId)
      attachmentEditor.setAttribute("file-name", fileName)
      attachmentEditor.setAttribute("file-size", fileSize)
      attachmentEditor.progress = progress

      const img = document.createElement("img");
      img.setAttribute("data-image-id", imageId)
      img.setAttribute("src", src);
      img.contentEditable = "false";
      img.setAttribute("draggable", "false");
      const figcaption = document.createElement("figcaption");

      figure.addEventListener("click", (e: Event) => {
        if (e.composedPath().includes(figcaption)) return

        if (typeof getPos === "function") {
          e.preventDefault()
          const pos = editor.state.doc.resolve(getPos()).pos
          editor.chain().setTextSelection(pos).selectTextblockEnd().run()
        }
      });

      figure.append(attachmentEditor, img, figcaption);

      return {
        dom: figure,
        contentDOM: figcaption,
      };
    };
  },

  addCommands() {
    return {
      setAttachment: (options: AttachmentManager | AttachmentManager[]) => ({
        commands,
      }) => {
        const attachments: AttachmentManager[] = Array.isArray(options)
          ? options
          : ([] as AttachmentManager[]).concat(options);
        const content: Record<string, unknown>[] = [];

        attachments.forEach((attachment) => {
          let captionContent: { type: "text"; text: string } | undefined

          if (attachment.caption) {
            captionContent = {
              type: "text",
              text: attachment.caption
            }
          }

          content.push({
            type: "attachment-figure",
            attrs: attachment,
            content: [
              {
                type: "paragraph",
                content: [
                  captionContent
                ],
              },
            ],
          });
          content.push({
            type: "paragraph",
          });
          content.push({
            type: "paragraph",
          });
          content.push({
            type: "paragraph",
          });
        });

        return commands.insertContent(content);
      },
    };
  },
});

const Figcaption = Node.create({
  name: "figcaption",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  content: "paragraph*",
  isolating: true,
  selectable: false,
  draggable: false,

  parseHTML() {
    return [
      {
        tag: "figcaption",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figcaption", mergeAttributes(HTMLAttributes), 0];
  },
});

export default Extension.create({
  addExtensions() {
    return [Attachment, AttachmentImage, Figcaption];
  },
});
