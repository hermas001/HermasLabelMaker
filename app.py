from flask import Flask, render_template, request, send_file, jsonify
import os
from svg_to_pdf import svg_to_pdf
import tempfile
import svgwrite

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-labels-pdf", methods=["POST"])
def generate_labels_pdf():
    label_array = request.json.get("labels", [])
    if not label_array:
        return jsonify({"error": "No label data provided."}), 400

    # --- Layout Constants (in mm) ---
    PAGE_WIDTH_MM = 145
    PAGE_HEIGHT_MM = 225
    LABEL_WIDTH_MM = 45.997
    LABEL_HEIGHT_MM = 29.438
    STICKER_GAP_X_MM = 1.2
    STICKER_GAP_Y_MM = 1.5
    COLS = 3
    ROWS = 7
    LABELS_PER_PAGE = COLS * ROWS
    GRID_WIDTH_MM = COLS * LABEL_WIDTH_MM + (COLS - 1) * STICKER_GAP_X_MM
    GRID_HEIGHT_MM = ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * STICKER_GAP_Y_MM
    MARGIN_X_MM = (PAGE_WIDTH_MM - GRID_WIDTH_MM) / 2
    MARGIN_Y_MM = (PAGE_HEIGHT_MM - GRID_HEIGHT_MM) / 2
    INNER_BOX_X_OFFSET_MM = 30.689
    INNER_BOX_Y_OFFSET_MM = 8.949
    INNER_BOX_WIDTH_MM = 13.121
    INNER_BOX_HEIGHT_MM = 11.1488

    # SVG uses px, so convert mm to px (1 mm ≈ 3.7795275591 px)
    MM_TO_PX = 3.7795275591
    def mm(val):
        return val * MM_TO_PX

    # Flatten label array according to numberOfStickers
    stickers = []
    for label in label_array:
        count = int(label.get('numberOfStickers', 1))
        for _ in range(count):
            stickers.append(label)
    stickers = stickers[:LABELS_PER_PAGE]

    svg_file = tempfile.mktemp(suffix=".svg")
    pdf_file = tempfile.mktemp(suffix=".pdf")
    dwg = svgwrite.Drawing(svg_file, size=(mm(PAGE_WIDTH_MM), mm(PAGE_HEIGHT_MM)))

    # Embed Franklin Gothic Demi font using @font-face in SVG defs with absolute file path for CairoSVG compatibility
    font_abs_path = os.path.abspath(os.path.join('static', 'font', 'franklingothic_demi.ttf')).replace('\\', '/')
    font_face_css = f'''
    @font-face {{
        font-family: "Franklin Gothic Demi";
        src: url("file:///{font_abs_path}");
    }}
    '''
    dwg.defs.add(dwg.style(font_face_css))

    for idx in range(LABELS_PER_PAGE):
        row = idx // COLS
        col = idx % COLS
        x = MARGIN_X_MM + col * (LABEL_WIDTH_MM + STICKER_GAP_X_MM)
        y = MARGIN_Y_MM + row * (LABEL_HEIGHT_MM + STICKER_GAP_Y_MM)
        group = dwg.g(transform=f"translate({mm(x)},{mm(y)})")
        # Outer label box
        group.add(dwg.rect(insert=(0, 0), size=(mm(LABEL_WIDTH_MM), mm(LABEL_HEIGHT_MM)), fill='white', stroke='black', stroke_width=mm(0.3)))
        # Inner box
        group.add(dwg.rect(insert=(mm(INNER_BOX_X_OFFSET_MM), mm(INNER_BOX_Y_OFFSET_MM)), size=(mm(INNER_BOX_WIDTH_MM), mm(INNER_BOX_HEIGHT_MM)), fill='white', stroke='black', stroke_width=mm(0.3)))
        # Manual controls for BATCH NO : placeholder
        BATCH_FONT_SIZE_MM = 4.5  # Font size in mm
        BATCH_SCALE_X = 1.0       # Horizontal scaling (1.0 = normal, >1 = stretch, <1 = shrink)
        BATCH_X_MM = 3.7          # X position in mm
        BATCH_Y_MM = 12           # Y position in mm
        # Placeholders
        group.add(dwg.text(
            "BATCH NO :",
            insert=(mm(BATCH_X_MM), mm(BATCH_Y_MM)),
            font_size=mm(BATCH_FONT_SIZE_MM),
            font_family='Franklin Gothic Demi',
            fill='black',
            transform=f'scale({BATCH_SCALE_X},1)'
        ))
        group.add(dwg.text(
            "QTY",
            insert=(mm(3.7), mm(22)),
            font_size=mm(4.5),
            font_family='Franklin Gothic Demi',
            fill='black'
        ))
        group.add(dwg.text(
            "→",
            insert=(mm(25), mm(22)),
            font_size=mm(4.5),
            font_family='Franklin Gothic Demi',
            fill='black'
        ))
        group.add(dwg.text(
            "MFG",
            insert=(mm(3.7), mm(28)),
            font_size=mm(4.5),
            font_family='Franklin Gothic Demi',
            fill='black'
        ))
        group.add(dwg.text(
            "→",
            insert=(mm(25), mm(28)),
            font_size=mm(4.5),
            font_family='Franklin Gothic Demi',
            fill='black'
        ))
        dwg.add(group)

    dwg.save()
    svg_to_pdf(svg_file, pdf_file)
    return send_file(pdf_file, as_attachment=True, download_name="herbal_product_labels.pdf")

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=8000)
