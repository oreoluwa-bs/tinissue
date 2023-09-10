import differenceInDays from "date-fns/differenceInDays";

export function getDueStatus(dueDate: Date | null) {
  if (!dueDate) return "NOT DUE";

  const diff = differenceInDays(dueDate, new Date());

  if (diff < 0) return "OVERDUE";

  if (diff === 0) return "DUE";

  if (diff <= 10) return "DUE SOON";

  return "NOT DUE";
}

export function getDueStatusColor(status: ReturnType<typeof getDueStatus>) {
  switch (status) {
    case "OVERDUE":
    case "DUE":
      return "text-red-500 opacity-100";

    case "DUE SOON":
      return "text-orange-500 opacity-100";

    case "NOT DUE":
    default:
      return "text-muted-foreground";
  }
}
