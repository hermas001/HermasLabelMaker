import svgwrite
import cairosvg

# Create SVG with skewed and stretched text
def create_svg(filename, text, font_family, font_size, fill, transform):
    dwg = svgwrite.Drawing(filename, size=(400, 120))
    dwg.add(dwg.text(
        text,
        insert=(20, 80),
        font_size=font_size,
        font_family=font_family,
        fill=fill,
        transform=transform
    ))
    dwg.save()

def svg_to_pdf(svg_filename, pdf_filename):
    cairosvg.svg2pdf(url=svg_filename, write_to=pdf_filename)
