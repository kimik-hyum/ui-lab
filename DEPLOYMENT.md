# 배포 (ECS EC2)

이 저장소는 EC2 기반 ECS에서 동작하는 Next.js 컨테이너를 빌드합니다. 실제 인프라 값은 git에 올리지 말고 예시 파일로 관리하세요.

## 관련 파일
- `Dockerfile`: 컨테이너 빌드용.
- `user-data.txt` (비공개): 실제 클러스터 이름이 들어가는 EC2 User Data.
- `user-data.example.txt`: 복사용 템플릿.

## 배포 절차 (요약)
1) 이미지를 빌드하고 ECR로 푸시합니다.

```bash
# build
docker build -t ui-lab:latest .

# tag + push (replace placeholders)
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag ui-lab:latest <account>.dkr.ecr.<region>.amazonaws.com/ui-lab:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/ui-lab:latest
```

2) ECS EC2 클러스터를 생성/업데이트합니다.
- ECS 최적화 AMI를 사용합니다.
- EC2 User Data에 `user-data.txt` 내용을 넣습니다.
- 인스턴스 역할에 `AmazonEC2ContainerServiceforEC2Role`(또는 동등 권한)을 부여합니다.

3) 태스크 정의를 생성/업데이트합니다.
- 이미지: 1단계 ECR 이미지.
- 컨테이너 포트: 3000.

4) 서비스를 생성/업데이트합니다.
- 원하는 수량과 배치 전략을 설정합니다.
- 외부 공개가 필요하면 ALB를 연결합니다.

## 참고
- 실제 클러스터 이름이 들어간 `user-data.txt`는 커밋하지 마세요. 로컬에 두거나 IaC 저장소/시크릿 매니저에 보관하세요.
- 이 저장소에는 `user-data.example.txt`만 커밋하는 것을 권장합니다.
