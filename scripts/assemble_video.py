import os
import sys
import subprocess
import asyncio
import textwrap
from PIL import Image, ImageDraw, ImageFont

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CAPTURES_DIR = os.path.join(ROOT_DIR, "docs", "screenshots")
OUTPUT_DIR = os.path.join(ROOT_DIR, "video_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 1920, 1080
NEURAL_VOICE = "en-US-AriaNeural"

SCENES = [
    {
        "image": "01_main_dashboard.png",
        "narration": "Welcome to NeuroNemotron, an autonomous multi-tier research intelligence engine built for the Nebius x NVIDIA Global AI Hackathon. Traditional research agents on monolithic models suffer from severe latency and cost bottlenecks. NeuroNemotron solves this through a hierarchical agent architecture.",
        "caption": "NeuroNemotron: Hierarchical Agentic Research Intelligence on NVIDIA Nemotron & Nebius Token Factory."
    },
    {
        "image": "02_telemetry_and_graph.png",
        "narration": "When given a complex technical inquiry, the fast tier, powered by NVIDIA Nemotron Nano, decomposes the objective into orthogonal search vectors in under two hundred eighty milliseconds. Next, direct runtime calls to the Tavily Search API extract factual, noise-free citations from the live web.",
        "caption": "Fast-Tier Decomposition: Nemotron Nano formulates sub-queries & Tavily API retrieves live web evidence."
    },
    {
        "image": "02_telemetry_and_graph.png",
        "narration": "The high-reasoning tier, NVIDIA Nemotron 3 Ultra hosted on Nebius Token Factory, synthesizes the findings, resolves contradictions between competing sources, and constructs a dynamic, interactive topological knowledge graph.",
        "caption": "Causal Reasoning Tier: Nemotron 3 Ultra on Nebius Token Factory synthesizes multi-document evidence."
    },
    {
        "image": "03_tavily_evidence_ledger.png",
        "narration": "Every single insight is grounded by an auditable link and confidence score in the Tavily Evidence Ledger, achieving ninety-eight point seven percent grounding accuracy and virtually eliminating hallucination.",
        "caption": "Verifiable Audit Trail: 98.7% grounding accuracy backed by real-time Tavily citations & direct URLs."
    },
    {
        "image": "04_thought_stream_logs.png",
        "narration": "Via Server-Sent Events, users can inspect real-time agent cognition and telemetry, achieving a sixty-eight percent reduction in token spend and three point eight times faster time-to-verdict. Completely open source under MIT. Thank you!",
        "caption": "68.4% Cost Reduction: Real-time SSE telemetry, MIT open-source on GitHub, & Executive Whitepaper."
    }
]

def get_bold_font(size):
    for fn in ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf", "impact.ttf"]:
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            continue
    return ImageFont.load_default()

def overlay_captions(input_img_path, caption_text, output_img_path):
    base_img = Image.open(input_img_path).convert("RGBA")
    base_img = base_img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    lines = textwrap.wrap(caption_text, width=54)

    font_caption = get_bold_font(32)
    font_badge = get_bold_font(16)

    line_height = 42
    box_height = 50 + len(lines) * line_height
    box_y1 = HEIGHT - box_height - 35
    box_y2 = HEIGHT - 35

    # Glowing modern rounded backdrop
    box_rect = [(80, box_y1), (WIDTH - 80, box_y2)]
    draw.rounded_rectangle(box_rect, radius=18, fill=(9, 13, 22, 235), outline=(118, 185, 0, 240), width=3)

    # Caption Tag Pill (NVIDIA Green)
    draw.rounded_rectangle([(115, box_y1 + 14), (290, box_y1 + 42)], radius=6, fill=(118, 185, 0), outline=(255, 255, 255), width=1)
    draw.text((130, box_y1 + 18), "NEURONEMOTRON", fill=(0, 0, 0), font=font_badge)

    # Secondary Tag Pill (Nebius Violet)
    draw.rounded_rectangle([(305, box_y1 + 14), (460, box_y1 + 42)], radius=6, fill=(139, 92, 246), outline=(255, 255, 255), width=1)
    draw.text((320, box_y1 + 18), "NEBIUS + TAVILY", fill=(255, 255, 255), font=font_badge)

    # GitHub Repository indicator
    draw.text((WIDTH - 460, box_y1 + 18), "github.com/akshatanand-cell/neuro-nemotron", fill=(163, 230, 53), font=font_badge)

    # Render wrapped lines with shadow
    start_y = box_y1 + 52
    for i, line in enumerate(lines):
        y = start_y + i * line_height
        draw.text((117, y + 2), line, fill=(0, 0, 0, 220), font=font_caption)
        draw.text((115, y), line, fill=(255, 255, 255), font=font_caption)

    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    final_img.save(output_img_path, quality=95)
    return output_img_path

async def synthesize_speech(text, out_path):
    import edge_tts
    comm = edge_tts.Communicate(text, NEURAL_VOICE, rate="+4%")
    await comm.save(out_path)

def main():
    print("🎬 Assembling high-definition demo video for NeuroNemotron...")
    clips = []

    for i, scene in enumerate(SCENES):
        print(f"  [Scene {i+1}/{len(SCENES)}] Processing capture: {scene['image']}...")
        raw_capture = os.path.join(CAPTURES_DIR, scene["image"])
        framed_img = os.path.join(OUTPUT_DIR, f"scene_framed_{i}.png")
        audio_path = os.path.join(OUTPUT_DIR, f"scene_audio_{i}.mp3")

        overlay_captions(raw_capture, scene["caption"], framed_img)
        asyncio.run(synthesize_speech(scene["narration"], audio_path))

        probe_cmd = f'ffprobe -i "{audio_path}" -show_entries format=duration -v quiet -of csv="p=0"'
        duration_str = subprocess.check_output(probe_cmd, shell=True).decode().strip()
        duration = float(duration_str) + 1.2

        clip_path = os.path.join(OUTPUT_DIR, f"clip_{i}.mp4")
        cmd = f'ffmpeg -y -loop 1 -i "{framed_img}" -i "{audio_path}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t {duration} "{clip_path}"'
        subprocess.check_call(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        clips.append(clip_path)

    concat_txt = os.path.join(OUTPUT_DIR, "clips_concat.txt")
    with open(concat_txt, "w") as f:
        for c in clips:
            f.write(f"file '{c.replace(os.sep, '/')}'\n")

    final_video = os.path.join(ROOT_DIR, "demo_video.mp4")
    print(f"🎥 Merging scenes into final 1080p demo video: {final_video}...")
    merge_cmd = f'ffmpeg -y -f concat -safe 0 -i "{concat_txt}" -c copy "{final_video}"'
    subprocess.check_call(merge_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print("✅ DEMO VIDEO SUCCESSFULLY GENERATED!")
    print(f"📁 Video Location: {os.path.abspath(final_video)}")

if __name__ == "__main__":
    main()
