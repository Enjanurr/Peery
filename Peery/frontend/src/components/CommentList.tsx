interface CommentListProps {
  comments: string[];
}

/** Comments are rendered as plain text (React escapes them) and carry no names or dates. */
export default function CommentList({ comments }: CommentListProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-200">Written feedback</h3>
      <p className="text-xs text-slate-400">Shown without names or dates, in alphabetical order.</p>

      {comments.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No written feedback was left.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {comments.map((comment, index) => (
            <li
              key={`${index}-${comment.slice(0, 24)}`}
              className="whitespace-pre-wrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-slate-200"
            >
              {comment}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}