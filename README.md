# 사내 AI 경진대회

## Painpoint(확정)
1. 기상악화/전쟁 등에 의한 ATA 지연 선제적 대응 및 소명 필요
2. B/L 기반 화물선 추적(수동), ATA 지연시 운송사에 소명서 요청 등의 대응지연, 로그 수기작성으로 인한 정보공유 애로
* B2B 고객사 대응 및 신뢰도 관리

### 해결방안
1. B/L 기반 화물선 추적 및 ETA 변동 로그 저장, ETA 변동 원인에 대한 정보수집/분석 제공
2. 웹기반 접속 및 확인

#### 기대효과
1. ETA변동시 실시간 확인 및 예상원인 확인으로 선제적 대응 가능
2. ATA 딜레이에 대한 선제적 대응으로 고객사 만족도 상승
3. 웹기반 접속 및 공유로 사내 정보공유 애로 해소

##### 구성 및 방법
1. 선박 트래킹 노드
  - 선박정보 : B/L 기반 수출신고번호 획득
  - 수출신고번호 기반 선박/편명 조회
  - aisstream.io 사용 선박위치 및 도착지, ETA 조회
2. 메인 노드
  - B/L 기반 관련정보 및 로그 관리
  - 선박위치조회 -> 실시간 트래킹(지도상 위치/출발지/도착지/ETA/화물내용 표기)
  - 선박
    
2. 자동 문서화 AI Tool
- 사용자 질문에 대한 의도파악, 답변 과정에서의 할루시네이션 감소
- 선박 및 항공기 트래킹 정보 입력
- 정해진 문서 양식에 맞게 내용 입력

###### 보완사항
1. 추가기능
- 자동번역
- 선박 관련 변동사항 알람
- B/L 입력으로 정보 확인
- 

####### Reference
1. B/L 기반 화물-화물선 조회
- Input : B/L
- Output : 선박명, 출항일자
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
2. 선박/편명 기준 MMSI 추출
- https://www.data.go.kr/data/15055851/openapi.do?recommendDataYn=Y
- 명세서 : javascript:fn_fileDownload('FILE_000000003044123','1')
- Endpoint : https://apis.data.go.kr/1192000/SicsVsslManp3
- 인증키 : 4a5f44c5e25d41e810a837ce4eb89e87a4b1bd81ccbcf84014bd8b2d2fb1250a
3. Web socket API 기반 선박 경로 무료 추적
- Input data : MMSI
- 홈 페이지 : https://aisstream.io/
- 깃허브 : https://aisstream.io/documentation
- API 정의 : https://github.com/aisstream/ais-message-models
- 예제 : https://github.com/aisstream/example
- API Key : a89b84973b662dbabc9ea8c1fdf6307f6fe3f9e4

######## 참가 인원

| 이름  | 직급 |
| --- | -- |
| 김영일 | 차장 |
| 김재철 | 대리 |
| 배석진 | 사원 |
