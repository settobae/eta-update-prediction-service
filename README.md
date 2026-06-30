# 사내 AI 경진대회

## Painpoint(확정)
1. 글로벌 공급망 리스크 선제 대응 (기상악화/전쟁 등)
2. B2B 고객사 대응 및 신뢰도 관리
3. 문서작성 및 번역 업무


### 해결방안
1. 

#### 구성 및 방법
1. 선박 트래킹
  - Ref. 참고하여 예제 사용
  -    
2. 자동 문서화 AI Tool
- 사용자 질문에 대한 의도파악, 답변 과정에서의 할루시네이션 감소
- 선박 및 항공기 트래킹 정보 입력
- 정해진 문서 양식에 맞게 내용 입력

##### 보완사항
1. 추가기능
- 자동번역
- 선박 관련 변동사항 알람
- B/L 입력으로 정보 확인
- 

###### Reference
1. Web socket API 기반 선박 경로 무료 추적
- 홈 페이지 : https://aisstream.io/
- 깃허브 : https://aisstream.io/documentation
- API 정의 : https://github.com/aisstream/ais-message-models
- 예제 : https://github.com/aisstream/example
- API Key : a89b84973b662dbabc9ea8c1fdf6307f6fe3f9e4
2. B/L 기반 화물-화물선 조회
- 관세청_화물통관징행정보 : https://www.data.go.kr/data/15126268/openapi.do
- 서비스명 : 수출신고번호별수출이행내역조회
- 서비스 ID : API002
- API 호출 예시(B/L) : https://unipass.customs.go.kr:38010/ext/rest/expDclrNoPrExpFfmnBrkdQry/retrieveExpDclrNoPrExpFfmnBrkd?crkyCn=x280l246b096x340g060g070y6&blNo=[조회할 B/L 번호]
- API 호출 예시(신고번호) : https://unipass.customs.go.kr:38010/ext/rest/expDclrNoPrExpFfmnBrkdQry/retrieveExpDclrNoPrExpFfmnBrkd?crkyCn=x280l246b096x340g060g070y6&expDclrNo=[조회할 수출신고번호]
- API Key : x280l246b096x340g060g070y6
- B/L 검색후 수출신고번호 확인하여 수출신고번호로 재검색해야 선박/편명 확인 가능
- 응답내용 중 사용할 내용
  - B/L No.검색
    - 수출자 상호 : exppnConm
    - 선적지 : shpmAirptPortNm
    - 출항일자 : tkofDt
    - 수출신고번호 : expDclrNo
  - 수출신고번호 검색
    - 선박/편명 : sanm
    - B/L 번호 : blNo

## 참가 인원

| 이름  | 직급 |
| --- | -- |
| 김영일 | 차장 |
| 김재철 | 대리 |
| 배석진 | 사원 |
