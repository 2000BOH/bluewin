export default function ContractDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">계약 상세 (준비 중)</h1>
      <p className="mt-2 text-sm text-muted-foreground">id: {params.id}</p>
      <p className="mt-1 text-sm text-muted-foreground">Phase 12 에서 구현 예정</p>
    </main>
  )
}
