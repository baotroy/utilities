import toast from "react-hot-toast";

export const copyToClipboard = (content: string) => {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success( "Copied to clipboard");
    })
    .catch(() => {
      toast.error( "Unable to copy");
    });

}