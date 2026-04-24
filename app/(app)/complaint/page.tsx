// 민원접수 (/complaint) - PDF 페이지 구성 신설
// 간단한 입력 폼만 제공. 저장 시 maintenance_requests 에 상태='접수' 로 등록되고
// 숙박형태 기반으로 R&R 담당자 번호가 자동 배분된다.

import PageHeader from '@/components/common/PageHeader'
import ComplaintForm from './ComplaintForm'

export const dynamic = 'force-dynamic'

export default function ComplaintPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title="민원접수"
        description="차수/호수와 민원 내용을 입력하면 접수현황에 등록되고 숙박형태에 따라 R&R 담당자로 자동 배분됩니다."
      />
      <div className="max-w-3xl">
        <ComplaintForm />
      </div>
    </div>
  )
}
