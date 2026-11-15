import { Metadata } from "next";
import DockerComposeConverterComponent from "./components/docker-compose-converter";

export const metadata: Metadata = {
  title: "docker run ↔ docker-compose Converter",
  description:
    "Convert docker run commands to a docker-compose.yml file and compose services back to docker run commands, in the browser.",
};

const DockerComposeConverter = () => {
  return <DockerComposeConverterComponent />;
};

export default DockerComposeConverter;
