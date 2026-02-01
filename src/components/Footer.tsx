import { Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-8 mt-12 border-t border-zinc-800">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <a
          href="https://linkedin.com/in/victor-ugochukwu"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-zinc-300 transition-colors"
        >
          Built by Victor Ugochukwu
        </a>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Public research tool.</span>
          <a
            href="https://linkedin.com/in/victor-ugochukwu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
