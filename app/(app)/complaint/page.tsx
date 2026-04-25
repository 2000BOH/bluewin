import PageHeader from '@/components/common/PageHeader'
import ComplaintPageClient from './ComplaintPageClient'

export const dynamic = 'force-dynamic'

export default function ComplaintPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="민원접수 / 객실정보"
        description="차수·호수 입력 시 객실정보가 자동 조회됩니다. 분류 선택 시 민원 등록, 미선택 시 객실정보만 저장됩니다."
      />
      <ComplaintPageClient />
    </div>
  )
}
