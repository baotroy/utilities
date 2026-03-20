"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import TextBox from "@/components/Input/TextBox";

interface StatusCode {
  code: number;
  message: string;
  description: string;
  category: string;
}

const httpStatusCodes: StatusCode[] = [
  // 1xx Informational
  { code: 100, message: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", category: "Informational" },
  { code: 101, message: "Switching Protocols", description: "The requester has asked the server to switch protocols and the server has agreed to do so.", category: "Informational" },
  { code: 102, message: "Processing", description: "The server has received and is processing the request, but no response is available yet.", category: "Informational" },
  { code: 103, message: "Early Hints", description: "Used to return some response headers before final HTTP message.", category: "Informational" },

  // 2xx Success
  { code: 200, message: "OK", description: "The request has succeeded. The meaning of the success depends on the HTTP method.", category: "Success" },
  { code: 201, message: "Created", description: "The request has succeeded and a new resource has been created as a result.", category: "Success" },
  { code: 202, message: "Accepted", description: "The request has been received but not yet acted upon.", category: "Success" },
  { code: 203, message: "Non-Authoritative Information", description: "The returned meta-information is not from the origin server.", category: "Success" },
  { code: 204, message: "No Content", description: "The server successfully processed the request and is not returning any content.", category: "Success" },
  { code: 205, message: "Reset Content", description: "The server successfully processed the request, asks that the requester reset its document view.", category: "Success" },
  { code: 206, message: "Partial Content", description: "The server is delivering only part of the resource due to a range header sent by the client.", category: "Success" },
  { code: 207, message: "Multi-Status", description: "The message body contains multiple status codes for multiple independent operations.", category: "Success" },
  { code: 208, message: "Already Reported", description: "The members of a DAV binding have already been enumerated.", category: "Success" },
  { code: 226, message: "IM Used", description: "The server has fulfilled a request for the resource with instance-manipulations applied.", category: "Success" },

  // 3xx Redirection
  { code: 300, message: "Multiple Choices", description: "The request has more than one possible response.", category: "Redirection" },
  { code: 301, message: "Moved Permanently", description: "The URL of the requested resource has been changed permanently.", category: "Redirection" },
  { code: 302, message: "Found", description: "The URI of requested resource has been changed temporarily.", category: "Redirection" },
  { code: 303, message: "See Other", description: "The response to the request can be found under another URI using GET method.", category: "Redirection" },
  { code: 304, message: "Not Modified", description: "The resource has not been modified since the version specified by the request headers.", category: "Redirection" },
  { code: 305, message: "Use Proxy", description: "The requested resource is available only through a proxy. (Deprecated)", category: "Redirection" },
  { code: 307, message: "Temporary Redirect", description: "The request should be repeated with another URI but future requests should still use the original URI.", category: "Redirection" },
  { code: 308, message: "Permanent Redirect", description: "The request and all future requests should be repeated using another URI.", category: "Redirection" },

  // 4xx Client Error
  { code: 400, message: "Bad Request", description: "The server cannot process the request due to client error (malformed syntax, invalid request).", category: "Client Error" },
  { code: 401, message: "Unauthorized", description: "Authentication is required and has failed or has not been provided.", category: "Client Error" },
  { code: 402, message: "Payment Required", description: "Reserved for future use. Originally intended for digital payment systems.", category: "Client Error" },
  { code: 403, message: "Forbidden", description: "The client does not have access rights to the content.", category: "Client Error" },
  { code: 404, message: "Not Found", description: "The server cannot find the requested resource.", category: "Client Error" },
  { code: 405, message: "Method Not Allowed", description: "The request method is known by the server but is not supported by the target resource.", category: "Client Error" },
  { code: 406, message: "Not Acceptable", description: "The server cannot produce a response matching the acceptable values defined in the request.", category: "Client Error" },
  { code: 407, message: "Proxy Authentication Required", description: "The client must first authenticate itself with the proxy.", category: "Client Error" },
  { code: 408, message: "Request Timeout", description: "The server timed out waiting for the request.", category: "Client Error" },
  { code: 409, message: "Conflict", description: "The request conflicts with the current state of the server.", category: "Client Error" },
  { code: 410, message: "Gone", description: "The content has been permanently deleted from server with no forwarding address.", category: "Client Error" },
  { code: 411, message: "Length Required", description: "The server requires the Content-Length header field.", category: "Client Error" },
  { code: 412, message: "Precondition Failed", description: "The server does not meet one of the preconditions specified in the request.", category: "Client Error" },
  { code: 413, message: "Payload Too Large", description: "Request entity is larger than limits defined by server.", category: "Client Error" },
  { code: 414, message: "URI Too Long", description: "The URI requested by the client is longer than the server is willing to interpret.", category: "Client Error" },
  { code: 415, message: "Unsupported Media Type", description: "The media format of the requested data is not supported by the server.", category: "Client Error" },
  { code: 416, message: "Range Not Satisfiable", description: "The range specified by the Range header cannot be fulfilled.", category: "Client Error" },
  { code: 417, message: "Expectation Failed", description: "The expectation indicated by the Expect request header cannot be met.", category: "Client Error" },
  { code: 418, message: "I'm a Teapot", description: "The server refuses to brew coffee because it is a teapot. (RFC 2324)", category: "Client Error" },
  { code: 421, message: "Misdirected Request", description: "The request was directed at a server that is not able to produce a response.", category: "Client Error" },
  { code: 422, message: "Unprocessable Entity", description: "The request was well-formed but was unable to be followed due to semantic errors.", category: "Client Error" },
  { code: 423, message: "Locked", description: "The resource that is being accessed is locked.", category: "Client Error" },
  { code: 424, message: "Failed Dependency", description: "The request failed due to failure of a previous request.", category: "Client Error" },
  { code: 425, message: "Too Early", description: "The server is unwilling to risk processing a request that might be replayed.", category: "Client Error" },
  { code: 426, message: "Upgrade Required", description: "The client should switch to a different protocol.", category: "Client Error" },
  { code: 428, message: "Precondition Required", description: "The origin server requires the request to be conditional.", category: "Client Error" },
  { code: 429, message: "Too Many Requests", description: "The user has sent too many requests in a given amount of time (rate limiting).", category: "Client Error" },
  { code: 431, message: "Request Header Fields Too Large", description: "The server is unwilling to process the request because header fields are too large.", category: "Client Error" },
  { code: 451, message: "Unavailable For Legal Reasons", description: "The resource is not available due to legal reasons (e.g., censorship).", category: "Client Error" },

  // 5xx Server Error
  { code: 500, message: "Internal Server Error", description: "The server has encountered a situation it doesn't know how to handle.", category: "Server Error" },
  { code: 501, message: "Not Implemented", description: "The request method is not supported by the server and cannot be handled.", category: "Server Error" },
  { code: 502, message: "Bad Gateway", description: "The server got an invalid response while working as a gateway.", category: "Server Error" },
  { code: 503, message: "Service Unavailable", description: "The server is not ready to handle the request (maintenance or overloaded).", category: "Server Error" },
  { code: 504, message: "Gateway Timeout", description: "The server is acting as a gateway and cannot get a response in time.", category: "Server Error" },
  { code: 505, message: "HTTP Version Not Supported", description: "The HTTP version used in the request is not supported by the server.", category: "Server Error" },
  { code: 506, message: "Variant Also Negotiates", description: "Transparent content negotiation for the request results in a circular reference.", category: "Server Error" },
  { code: 507, message: "Insufficient Storage", description: "The server is unable to store the representation needed to complete the request.", category: "Server Error" },
  { code: 508, message: "Loop Detected", description: "The server detected an infinite loop while processing the request.", category: "Server Error" },
  { code: 510, message: "Not Extended", description: "Further extensions to the request are required for the server to fulfill it.", category: "Server Error" },
  { code: 511, message: "Network Authentication Required", description: "The client needs to authenticate to gain network access.", category: "Server Error" },
];

const categoryColors: Record<string, string> = {
  "Informational": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Success": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Redirection": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "Client Error": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Server Error": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function HttpStatusCodesComponent() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<number | null>(null);

  const categories = ["Informational", "Success", "Redirection", "Client Error", "Server Error"];

  const filteredCodes = httpStatusCodes.filter((status) => {
    const matchesSearch =
      !search ||
      status.code.toString().includes(search) ||
      status.message.toLowerCase().includes(search.toLowerCase()) ||
      status.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || status.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const groupedCodes = categories.reduce((acc, category) => {
    acc[category] = filteredCodes.filter((s) => s.category === category);
    return acc;
  }, {} as Record<string, StatusCode[]>);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Complete reference of HTTP status codes with descriptions and explanations.
        </p>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <div className="mb-2">Search</div>
            <TextBox
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code number or message (e.g., 404 or Not Found)"
              additionalClass="w-full"
            />
          </div>

          {/* Category Filter */}
          <div>
            <div className="mb-2">Filter by Category</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${!selectedCategory
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${selectedCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                    }`}
                >
                  {cat} ({cat[0]}xx)
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-body dark:text-bodydark2">
            Showing {filteredCodes.length} of {httpStatusCodes.length} status codes
          </div>

          {/* Status Codes */}
          <div className="space-y-6">
            {categories.map((category) => {
              const codes = groupedCodes[category];
              if (codes.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-sm ${categoryColors[category]}`}>
                      {category[0] === "I" ? "1" : category[0] === "S" && category.includes("Success") ? "2" : category[0] === "R" ? "3" : category[0] === "C" ? "4" : "5"}xx
                    </span>
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {codes.map((status) => (
                      <div
                        key={status.code}
                        className="bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedCode(expandedCode === status.code ? null : status.code)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-sm font-mono font-bold ${categoryColors[category]}`}>
                              {status.code}
                            </span>
                            <span className="font-medium">{status.message}</span>
                          </div>
                          <span className="text-body dark:text-bodydark2">
                            {expandedCode === status.code ? "−" : "+"}
                          </span>
                        </button>
                        {expandedCode === status.code && (
                          <div className="px-4 pb-3 text-sm text-body dark:text-bodydark2 border-t border-stroke dark:border-strokedark pt-3">
                            {status.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Reference */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">Quick Reference</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div><span className={`px-1.5 py-0.5 rounded ${categoryColors["Informational"]}`}>1xx</span> Informational responses</div>
              <div><span className={`px-1.5 py-0.5 rounded ${categoryColors["Success"]}`}>2xx</span> Successful responses</div>
              <div><span className={`px-1.5 py-0.5 rounded ${categoryColors["Redirection"]}`}>3xx</span> Redirection messages</div>
              <div><span className={`px-1.5 py-0.5 rounded ${categoryColors["Client Error"]}`}>4xx</span> Client error responses</div>
              <div><span className={`px-1.5 py-0.5 rounded ${categoryColors["Server Error"]}`}>5xx</span> Server error responses</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
