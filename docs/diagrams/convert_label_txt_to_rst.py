import sys
import re
from pathlib import Path


def convert_txt_to_rst(txt_filepath,
                       rst_output_path=None,
                       image_path=None,
                       width=560,
                       height=500):
    txt_path = Path(txt_filepath).resolve()

    if not txt_path.exists():
        print(f"Error: Text file does not exist at: {txt_path}")
        return

    # Infer RST path if not specified
    if rst_output_path is None:
        rst_path = txt_path.with_suffix(".rst")
    else:
        rst_path = Path(rst_output_path).resolve()

    # Infer Image path if not specified
    if image_path is None:
        img_path = txt_path.with_suffix(".jpg")
        if not img_path.exists():
            # Search for case variants like Microscope.jpg or microscope.png
            jpg_candidates = list(txt_path.parent.glob("*.jpg")) + list(
                txt_path.parent.glob("*.png"))
            if jpg_candidates:
                img_path = jpg_candidates[0]
    else:
        img_path = Path(image_path).resolve()

    # Calculate relative image path for RST
    try:
        rel_img_for_rst = img_path.relative_to(rst_path.parent).as_posix()
    except ValueError:
        rel_img_for_rst = img_path.name

    print(f"Reading Text File: {txt_path}")
    print(f"Target RST File:   {rst_path}")
    print(f"Target Image File: {img_path}")

    # 1. Read and decode text file safely
    raw = txt_path.read_bytes()

    text = None
    for enc in ['utf-8', 'utf-8-sig', 'utf-16', 'utf-16-le', 'latin-1']:
        try:
            decoded = raw.decode(enc)
            if '\x00' in decoded:
                decoded = decoded.replace('\x00', '')
            text = decoded
            break
        except (UnicodeDecodeError, UnicodeError):
            continue

    if not text:
        text = raw.decode('latin-1', errors='replace')

    # Normalize line endings and strip hidden control characters
    text = re.sub(r'[^\x20-\x7E\n\r\t]', '', text)
    raw_lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    lines = [l.strip() for l in raw_lines if l.strip()]

    # 2. State Machine Parsing
    labels = []
    positions = []
    metadata = []

    # Regex matches coordinate line format: 350,134,463,156,left
    coord_regex = re.compile(r'^\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+')

    for line in lines:
        if coord_regex.match(line):
            positions.append(line)
        elif len(positions) == 0:
            # Anything before coordinates is a label
            labels.append(line)
        else:
            # Anything after coordinates is metadata
            metadata.append(line)

    if not labels or not positions:
        print(
            f"Error: Could not parse labels ({len(labels)}) or positions ({len(positions)}) from text file."
        )
        return

    # Metadata extraction
    year = metadata[0] if len(metadata) > 0 else "N/A"
    strand = metadata[1] if len(metadata) > 1 else "N/A"
    title = metadata[2] if len(metadata) > 2 else txt_path.stem.capitalize()
    source = metadata[3] if len(metadata) > 3 else "N/A"

    data_pairs = []
    for idx, pos_line in enumerate(positions):
        parts = [p.strip() for p in pos_line.split(',')]
        if len(parts) >= 4:
            label = labels[idx] if idx < len(labels) else f"Label {idx+1}"

            # Cast coordinate values to integers
            x1, y1, x2, y2 = [int(p) for p in parts[:4]]

            # Adjust horizontal offset
            x1 -= 2
            x2 -= 2
            # Adjust vertical offset
            y1 -= 76
            y2 -= 76

            align = parts[4] if len(parts) >= 5 else "left"
            data_pairs.append({
                "label": label,
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "align": align
            })

    # 3. Build RST Output
    ref_name = title.lower().replace(" ", "_")
    title_underline = "=" * len(title)

    # rst_content = f".. _{ref_name}_diagram:\n\n"
    rst_content = f"{title_underline}\n{title}\n{title_underline}\n\n"
    rst_content += f"| **Year Level:** {year}\n"
    rst_content += f"| **Strand:** {strand}\n"
    rst_content += f"| **Source:** {source}\n\n"

    # Directive block
    rst_content += f".. label-diagram::\n"
    rst_content += f"   :image: {rel_img_for_rst}\n"
    rst_content += f"   :width: {width}\n"
    rst_content += f"   :height: {height}\n\n"

    for p in data_pairs:
        rst_content += f"   * - label: {p['label']}\n"
        rst_content += f"     - pos: {p['x1']},{p['y1']},{p['x2']},{p['y2']}\n"
        rst_content += f"     - align: {p['align']}\n"


    # Write file
    rst_path.parent.mkdir(parents=True, exist_ok=True)
    rst_path.write_text(rst_content, encoding='utf-8')

    print(f"\nSuccessfully generated RST file:\n -> {rst_path}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_txt = sys.argv[1]
    else:
        # target_txt = r"C:\Users\gmccarthy\Documents\PC_RTD_GITHUB_resources\RTD_TESTING\docs\info\diagrams\Classification.txt"
        target_txt = r"C:\Users\gmccarthy\Documents\PC_RTD_GITHUB_resources\RTD_TESTING\docs\info\diagrams\Cells - animal 4.txt"

    convert_txt_to_rst(target_txt)