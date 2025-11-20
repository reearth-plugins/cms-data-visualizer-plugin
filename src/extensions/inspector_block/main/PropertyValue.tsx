import { FC } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export type SingleValueProperty = {
  id: string;
  key: string;
  type: string;
  value: string | number | boolean | undefined;
};

export type Props = {
  property: SingleValueProperty;
};

const PropertyValue: FC<Props> = ({ property }) => {
  return property.type === "asset" ? (
    isImageUrl(property.value as string) ? (
      <img
        src={property.value as string}
        alt="asset"
        className="max-w-full h-auto"
      />
    ) : (
      <a
        href={property.value as string}
        className="whitespace-pre-wrap break-words text-blue-600 hover:underline"
      >
        {property.value}
      </a>
    )
  ) : property.type === "url" ? (
    <a
      href={property.value as string}
      className="whitespace-pre-wrap break-words text-blue-600 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {property.value}
    </a>
  ) : property.type === "markdown" ? (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
        }}
      >
        {property.value as string}
      </ReactMarkdown>
    </div>
  ) : property.type === "bool" ? (
    <div className="whitespace-pre-wrap break-words">
      {property.value ? "True" : "False"}
    </div>
  ) : property.type === "date" ? (
    <div className="whitespace-pre-wrap break-words">
      {new Date(property.value as string).toLocaleString()}
    </div>
  ) : property.type === "object" ? (
    <div className="whitespace-pre-wrap break-words">
      {JSON.stringify(property.value, null, 2)}
    </div>
  ) : (
    <div className="whitespace-pre-wrap break-words">
      {property.value?.toString()}
    </div>
  );
};

export default PropertyValue;

const isImageUrl = (url: string) => {
  return /\.(jpeg|jpg|gif|png|svg)$/.test(url.toLowerCase());
};
