import { Container, Row } from "@/components/Container";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageTitle } from "@/components/layout/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { keysQueryOptions, keyValueQueryOptions } from "@/lib/queries/etcd";
import type { Key } from "@/lib/types/etcd";
import { cn } from "@/lib/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  File,
  Folder,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const Route = createFileRoute("/keys/$")({
  loader: async ({ context: { queryClient }, params }) => {
    const pathParam = params["_splat"] || "";
    const currentPath = pathParam || "";
    const lookupPath = currentPath ? currentPath.replace(/\/$/, "") + "/" : "/";
    return queryClient.ensureQueryData(keysQueryOptions(lookupPath));
  },
  component: KeyBrowserPage,
});

export function KeyBrowserPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [currentPage, setCurrentPage] = useState(1);

  const pathParam = params["_splat"] || "";
  const currentPath = pathParam || "";
  const pathParts = currentPath.split("/").filter(Boolean);

  const lookupPath = currentPath ? currentPath.replace(/\/$/, "") + "/" : "/";
  const { data: keys } = useSuspenseQuery(keysQueryOptions(lookupPath));

  const endsWithSlash = currentPath.endsWith("/") || currentPath === "";
  const isDirectory = endsWithSlash || keys.length > 0;

  const breadcrumbs = [
    { label: "Keys", href: "/keys" },
    ...pathParts.map((part, index) => ({
      label: part,
      href:
        index === pathParts.length - 1 && !isDirectory
          ? undefined
          : `/keys/${pathParts.slice(0, index + 1).join("/")}/`,
    })),
  ];

  const filteredKeys = useMemo(() => {
    return keys.filter((k) =>
      k.key.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [keys, searchQuery]);

  const totalPages = Math.ceil(filteredKeys.length / pageSize);
  const paginatedKeys = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredKeys.slice(start, start + pageSize);
  }, [filteredKeys, currentPage, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value) as PageSize);
    setCurrentPage(1);
  };

  if (!isDirectory && pathParts.length > 0) {
    return (
      <KeyDetailView
        currentPath={currentPath}
        pathParts={pathParts}
        breadcrumbs={breadcrumbs}
        copied={copied}
        setCopied={setCopied}
      />
    );
  }

  const handleKeyClick = (key: Key) => {
    // Ensure proper path separator between currentPath and key
    const basePath = currentPath ? currentPath.replace(/\/$/, "") + "/" : "";
    navigate({ to: `/keys/${basePath}${key.key}` });
  };

  const header = (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <PageTitle title="Key Browser" />
    </>
  );

  return (
    <PageLayout header={header}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter keys"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Keys list */}
        {paginatedKeys.length === 0 ? (
          <Empty className="bg-card border border-border rounded-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {searchQuery ? <Search /> : <Folder />}
              </EmptyMedia>
              <EmptyTitle>
                {searchQuery
                  ? "No keys match your filter"
                  : "No keys in this path"}
              </EmptyTitle>
              <EmptyDescription>
                {searchQuery
                  ? "Try adjusting your search query"
                  : "This path is empty. Keys will appear here once added."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Container>
            {paginatedKeys.map((key) => (
              <KeyRow
                key={key.key}
                etcdKey={key}
                onClick={() => handleKeyClick(key)}
              />
            ))}
          </Container>
        )}

        {/* Pagination */}
        {filteredKeys.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredKeys.length)} of{" "}
              {filteredKeys.length} keys
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

function KeyDetailView({
  currentPath,
  pathParts,
  breadcrumbs,
  copied,
  setCopied,
}: {
  currentPath: string;
  pathParts: string[];
  breadcrumbs: Array<{ label: string; href?: string }>;
  copied: boolean;
  setCopied: (copied: boolean) => void;
}) {
  const navigate = useNavigate();

  const keyName = pathParts[pathParts.length - 1];
  const parentPath = pathParts.slice(0, -1).join("/");
  const lookupParentPath = parentPath ? parentPath + "/" : "/";

  const { data: keysInParent } = useSuspenseQuery(
    keysQueryOptions(lookupParentPath),
  );
  const { data: keyData } = useSuspenseQuery(
    keyValueQueryOptions(currentPath.replace(/\/$/, "")),
  );

  const keyMeta = keysInParent.find((k) => k.key === keyName);

  const handleCopyValue = async () => {
    await navigator.clipboard.writeText(keyData.value || "");
    setCopied(true);
    toast.success("Value copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    navigate({ to: `/keys/${parentPath ? parentPath + "/" : ""}` });
  };

  const header = (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <PageTitle title={`/${currentPath}`} />
    </>
  );

  if (!keyMeta) {
    return (
      <PageLayout header={header}>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">This key does not exist.</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={header}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Value card */}
          <div className="lg:col-span-2">
            <Card className="etcd-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">Value</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyValue}
                  className="gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono max-h-96">
                  {keyData.value || (
                    <span className="text-muted-foreground italic">
                      No value
                    </span>
                  )}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Metadata card */}
          <div>
            <Card className="etcd-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y divide-border">
                <MetadataRow label="Key" value={`/${currentPath}`} mono />
                <MetadataRow
                  label="Revision"
                  value={keyMeta.revision?.toString() || "—"}
                />
                <MetadataRow
                  label="Create Revision"
                  value={keyMeta.createRevision?.toString() || "—"}
                />
                <MetadataRow
                  label="Mod Revision"
                  value={keyMeta.modRevision?.toString() || "—"}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

function MetadataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function KeyRow({ etcdKey, onClick }: { etcdKey: Key; onClick: () => void }) {
  return (
    <Row
      className="flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {etcdKey.isDirectory ? (
          <Folder className="h-5 w-5 text-warning" />
        ) : (
          <File className="h-5 w-5 text-primary/70" />
        )}
        <span className={cn("font-mono", etcdKey.isDirectory && "font-medium")}>
          {etcdKey.key}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {!etcdKey.isDirectory && etcdKey.revision && (
          <span className="text-sm text-muted-foreground">
            rev {etcdKey.revision}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Row>
  );
}

function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-2">
      {items.map((crumb, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {crumb.href ? (
            <Link to={crumb.href} className="text-primary hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-muted-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
