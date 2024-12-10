import React from 'react';
import Resizer from 'react-image-file-resizer';

import { Icons } from './icons';
import { Avatar } from './ui/avatar';
import { Button } from './ui/button';

export function AvatarUploader({
  src,
  fallback,
  getUploadUrl,
  uploadCallback,
}: {
  src?: string | null;
  fallback?: string;
  getUploadUrl: (
    fileName: string,
  ) => Promise<{ url: string; fields: Record<string, string> } | undefined>;
  uploadCallback: (uploadStatus: boolean) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const resizeFile = (file: FileList[number]) =>
    new Promise<string | Blob | File | ProgressEvent<FileReader>>((resolve) => {
      return Resizer.imageFileResizer(
        file,
        300,
        300,
        'JPEG',
        100,
        0,
        (uri) => {
          resolve(uri);
        },
        'blob',
      );
    });

  const handleUpload = async () => {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      return;
    }

    let file = files[0] as any;

    //Resize file if it's not a svg
    if (files[0].type !== 'image/svg+xml') {
      file = await resizeFile(file);
    }

    const presignedPostData = await getUploadUrl(files[0].name);
    if (!presignedPostData) {
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(presignedPostData.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);

      const result = await fetch(presignedPostData.url, {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        return uploadCallback(false);
      }

      return uploadCallback(true);
    } catch {
      return uploadCallback(false);
    }
  };

  return (
    <Avatar className="size-24 rounded-full border relative">
      <Avatar.Image src={src ?? undefined} />
      <Avatar.Fallback className="text-3xl">{fallback?.[0]}</Avatar.Fallback>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        size="icon"
        variant="ghost"
        type="button"
        className="absolute -right-1 -top-1 border rounded-full bg-background p-0 size-7"
        onClick={() => inputRef.current?.click()}
      >
        <Icons.pencil />
      </Button>
    </Avatar>
  );
}
