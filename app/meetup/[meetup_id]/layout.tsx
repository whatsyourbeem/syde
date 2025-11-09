export default async function MeetupDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ meetup_id: string }>; // Promise로 변경
}) {
  // params를 await로 풀어서 사용
  const { meetup_id } = await params;

  // Benignly "use" params in development to satisfy the linter
  if (process.env.NODE_ENV === "development") {
    console.log("Meetup layout params:", meetup_id);
  }

  return <>{children}</>;
}
