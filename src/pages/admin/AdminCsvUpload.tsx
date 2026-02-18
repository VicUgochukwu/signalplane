import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Upload, X, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PreviewData {
  columns: string[];
  columnMapping: Record<string, string>;
  validRows: number;
  skippedRows: number;
  errors: string[];
  sampleRows: Array<{
    text: string;
    author: string;
    date: string;
    company: string;
  }>;
}

interface UploadResult {
  success: boolean;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  errors?: string[];
}

const SUPABASE_URL = 'https://dnqjzgfunvbofsuibcsk.supabase.co';

export default function AdminCsvUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('manual');
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const { data: recentUploads, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin-upload-history'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_usage_leaderboard', {
        p_days: 30,
        p_limit: 10,
      });
      if (error) throw error;
      return data;
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setPreviewData(null);
      setUploadResult(null);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setUploadResult(null);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewData(null);
    setUploadResult(null);
  }, []);

  const handlePreview = async () => {
    if (!file) return;

    setIsPreviewLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        toast.error('Please log in to upload data');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source_name', sourceName || 'Unnamed Upload');
      formData.append('source_type', sourceType);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/csv-upload?preview=true`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preview failed');
      }

      setPreviewData(data);
    } catch (error) {
      toast.error('Preview failed', { description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        toast.error('Please log in to upload data');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('source_name', sourceName || 'Unnamed Upload');
      formData.append('source_type', sourceType);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/csv-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult({
        success: true,
        totalRows: data.totalRows || 0,
        validRows: data.validRows || 0,
        skippedRows: data.skippedRows || 0,
      });
      toast.success('Upload completed successfully');
    } catch (error) {
      toast.error('Upload failed', { description: error instanceof Error ? error.message : 'Unknown error' });
      setUploadResult({
        success: false,
        totalRows: 0,
        validRows: 0,
        skippedRows: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSourceName('');
    setSourceType('manual');
    setPreviewData(null);
    setUploadResult(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">CSV Upload</h2>

        {/* Upload Form */}
        {!uploadResult && (
          <Card className="bg-muted/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Upload CSV Data</CardTitle>
              <CardDescription>
                Import objection and feedback data from external sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${isDragging
                    ? 'border-[hsl(var(--accent-signal))] bg-[hsl(var(--accent-signal)/0.05)]'
                    : 'border-border hover:border-[hsl(var(--accent-signal)/0.5)]'
                  }
                `}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-accent-signal" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-foreground font-medium">
                      Drop your CSV file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports .csv files up to 5MB
                    </p>
                  </>
                )}
              </div>

              {/* Source Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input
                    id="source-name"
                    placeholder="e.g., LinkedIn Export, Gong Calls"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-type">Source Type</Label>
                  <Select value={sourceType} onValueChange={setSourceType}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="call_transcript">Call Transcript</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview Button */}
              {file && !previewData && (
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={isPreviewLoading}
                  className="w-full sm:w-auto"
                >
                  {isPreviewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Preview'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview Results */}
        {previewData && !uploadResult && (
          <Card className="bg-muted/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Preview Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Validation Summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm">{previewData.validRows} rows valid</span>
                </div>
                {previewData.skippedRows > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm">{previewData.skippedRows} rows skipped</span>
                  </div>
                )}
                {previewData.errors.length > 0 && (
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-400" />
                    <span className="text-sm">{previewData.errors.length} errors</span>
                  </div>
                )}
              </div>

              {/* Column Mapping */}
              <div>
                <h4 className="text-sm font-medium mb-2">Column Mapping</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewData.columnMapping).map(([col, type]) => (
                    <span
                      key={col}
                      className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground"
                    >
                      {col} → {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Data */}
              {previewData.sampleRows.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Sample Data (first 5 rows)</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Text</TableHead>
                          <TableHead>Author</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Company</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.sampleRows.map((row, idx) => (
                          <TableRow key={idx} className="border-border">
                            <TableCell className="max-w-xs truncate text-sm">
                              {row.text?.slice(0, 200)}
                            </TableCell>
                            <TableCell className="text-sm">{row.author || '-'}</TableCell>
                            <TableCell className="text-sm">{row.date || '-'}</TableCell>
                            <TableCell className="text-sm">{row.company || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {previewData.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-400">Errors</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {previewData.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-red-400/80">{error}</li>
                    ))}
                    {previewData.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ...and {previewData.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || previewData.validRows === 0}
                  className="bg-[hsl(var(--accent-signal))] hover:bg-[hsl(var(--accent-signal)/0.85)]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading {previewData.validRows} rows...
                    </>
                  ) : (
                    `Upload All (${previewData.validRows} rows)`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <Card className={`border ${uploadResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <CardContent className="p-8 text-center">
              {uploadResult.success ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Successfully imported {uploadResult.validRows} rows
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Total: {uploadResult.totalRows} | Valid: {uploadResult.validRows} | Skipped: {uploadResult.skippedRows}
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Upload Failed</h3>
                  {uploadResult.errors?.map((error, idx) => (
                    <p key={idx} className="text-red-400">{error}</p>
                  ))}
                </>
              )}
              <Button onClick={resetForm} className="mt-4">
                Upload Another
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload History */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 bg-muted" />
                ))}
              </div>
            ) : recentUploads && recentUploads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>User</TableHead>
                    <TableHead>Uploads</TableHead>
                    <TableHead>Rows Processed</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUploads.map((upload: any) => (
                    <TableRow key={upload.user_id} className="border-border">
                      <TableCell className="text-sm">{upload.user_email || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{upload.upload_count}</TableCell>
                      <TableCell className="text-sm">
                        {upload.total_rows_processed?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {upload.last_active 
                          ? new Date(upload.last_active).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upload history available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
