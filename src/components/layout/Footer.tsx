import { Link } from 'react-router-dom'
import { Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-body">
            &copy; {new Date().getFullYear()} WatchMe. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-body"
            >
              About
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-body"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-body"
            >
              Privacy
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
