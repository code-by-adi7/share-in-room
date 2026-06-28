export default function FullScreenLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-colors">
      <div className="relative flex justify-center items-center">
        <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-400 opacity-20"></div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 dark:border-blue-900/50 border-t-blue-600 dark:border-t-blue-400"></div>
      </div>
      <p className="mt-4 text-blue-600 dark:text-blue-400 font-medium tracking-wide animate-pulse">
        {message}
      </p>
    </div>
  )
}
