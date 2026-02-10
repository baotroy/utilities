import { Metadata } from "next";
import CronEditorComponent from "../components/cron-editor";

export const metadata: Metadata = {
  title: "Cron Expression Editor",
  description:
    "Build and validate cron schedule expressions. Interactive editor with presets, human-readable descriptions, and next run time calculations.",
};

const CronEditor = () => {
  return <CronEditorComponent />;
};

export default CronEditor;
