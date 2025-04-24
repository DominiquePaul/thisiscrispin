"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { toast } from "@/components/ui/use-toast";

export default function NewPostDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Automatically generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Generate slug: lowercase, replace spaces with hyphens, remove special chars
    if (!slug || slug === generateSlugFromTitle(title)) {
      setSlug(generateSlugFromTitle(newTitle));
    }
  };

  const generateSlugFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single one
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    if (!slug.trim()) {
      setError("Slug is required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/contentful/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType: 'markdownrtc',
          fields: {
            title: { 'en-US': title },
            slug: { 'en-US': slug },
            mainContent: { 'en-US': '# ' + title + '\n\nStart writing here...' },
            excerpt: { 'en-US': title }
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }
      
      toast({
        title: "Success!",
        description: "Your new post has been created.",
      });
      
      setIsOpen(false);
      setTitle("");
      setSlug("");
      
      // Navigate to the new post
      router.push(`/p/${slug}`);
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error instanceof Error ? error.message : 'Failed to create post');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">New Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Enter a title and a unique slug for your new post.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                className="col-span-3"
                placeholder="My New Post"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="col-span-3"
                placeholder="my-new-post"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm px-4">{error}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 