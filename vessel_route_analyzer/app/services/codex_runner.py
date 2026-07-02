import json
import asyncio
import logging
import os
import shutil
import signal
import tempfile
import uuid

logger = logging.getLogger(__name__)


async def run_codex_prompt(prompt: str, timeout_seconds: float = 45.0) -> dict:
    """
    로컬 'codex' CLI를 'codex exec' 비대화형 서브커맨드로 실행하고,
    '--output-last-message' 옵션으로 모델의 최종 응답만 별도 파일에 받아 JSON으로 파싱합니다.
    (대화형 TUI를 pty로 흉내 내던 이전 방식은 배너/ANSI 노이즈가 섞여 JSON 파싱이 불안정했습니다.)
    """
    codex_executable = shutil.which("codex") or "codex"

    logger.info(
        "[2/4] Codex CLI 호출 시작 | executable=%s prompt_len=%d timeout=%ss",
        codex_executable, len(prompt), timeout_seconds
    )

    output_path = os.path.join(tempfile.gettempdir(), f"codex_last_msg_{uuid.uuid4().hex}.txt")

    try:
        process = await asyncio.create_subprocess_exec(
            codex_executable,
            "exec",
            "--skip-git-repo-check",
            "--output-last-message", output_path,
            "--",
            prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            start_new_session=True,  # 웹 검색 등으로 codex가 띄우는 자식 프로세스까지 한번에 종료하기 위해 별도 프로세스 그룹으로 실행
        )

        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout_seconds)
        except asyncio.TimeoutError:
            # process.kill()은 codex 프로세스 자신만 죽이는데, codex가 띄운 검색용 자식 프로세스가
            # stdout/stderr 파이프의 쓰기 쪽을 물고 있으면 communicate()가 EOF를 못 받아 종료가 크게 지연됨.
            # 프로세스 그룹 전체를 죽여서 자식까지 함께 정리한다.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            await process.wait()
            raise TimeoutError(f"Codex CLI 분석 시간이 초과되었습니다 (최대 {timeout_seconds:.0f}초 제한).")

        if process.returncode != 0:
            err_msg = stderr.decode("utf-8", errors="ignore")
            logger.error("Codex CLI 반환코드 오류 | returncode=%s stderr=%s", process.returncode, err_msg)
            raise RuntimeError(f"Codex CLI 에러 (반환코드 {process.returncode}): {err_msg}")

        if not os.path.exists(output_path):
            raise RuntimeError("Codex CLI가 최종 응답 파일을 생성하지 않았습니다.")

        with open(output_path, "r", encoding="utf-8") as f:
            output_text = f.read()

        logger.info("Codex CLI 원본 출력 수신 완료 | raw_len=%d chars", len(output_text))

        # 최종 응답에 설명 문구가 섞여 온 경우를 대비한 JSON 추출
        clean_json = output_text.strip()
        start_idx = clean_json.find("{")
        end_idx = clean_json.rfind("}")
        if start_idx != -1 and end_idx != -1:
            clean_json = clean_json[start_idx:end_idx + 1]

        logger.debug("Codex CLI 정제된 응답 JSON:\n%s", clean_json)

        result = json.loads(clean_json)
        logger.info(
            "[3/4] Codex CLI 응답 파싱 성공 | keys=%s",
            list(result.keys()) if isinstance(result, dict) else type(result).__name__
        )
        return result

    except Exception as e:
        logger.error("Codex CLI 호출/파싱 실패 | %s", e)
        raise RuntimeError(f"로컬 'codex' CLI 호출 실패: {e}")
    finally:
        try:
            os.remove(output_path)
        except OSError:
            pass
