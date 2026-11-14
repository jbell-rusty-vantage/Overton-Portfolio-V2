"""Build the portfolio's two-page PDF from the same content as /resume."""

import json
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "resume.json"
OUTPUT = ROOT / "public" / "john-overton-bell-resume.pdf"
INK = colors.HexColor("#212829")
GREEN = colors.HexColor("#275149")
MUTED = colors.HexColor("#4b5757")
RULE = colors.HexColor("#ccd6d2")
MARGIN = 48


def style(name, size, leading, *, bold=False, color=INK, before=0, after=0):
    return ParagraphStyle(
        name,
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=size,
        leading=leading,
        textColor=color,
        spaceBefore=before,
        spaceAfter=after,
    )


NAME = style("Name", 34, 39, bold=True, after=4)
TITLE = style("Title", 13, 17, bold=True, color=GREEN, after=12)
CONTACT = style("Contact", 10, 15, color=MUTED, after=2)
CONTINUED = style("Continued", 19, 23, bold=True, after=4)
HEADING = style("Heading", 15, 20, bold=True, color=GREEN, before=17, after=5)
BODY = style("Body", 11, 15, after=6)
ENTRY = style("Entry", 11, 15, after=1)
NOTE = style("Note", 10, 13, color=MUTED)


def link(label, url):
    return f'<a href={quoteattr(url)} color="#275149"><u>{escape(label)}</u></a>'


def labeled(label, detail):
    return Paragraph(f"<b>{escape(label)}:</b> {escape(detail)}", BODY)


def project(entry):
    links = "  |  ".join(link(item["label"], item["url"]) for item in entry["links"])
    return KeepTogether([
        Paragraph(f'<b>{escape(entry["name"])}</b>  |  {links}', ENTRY),
        Paragraph(escape(entry["detail"]), BODY),
    ])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, 43, letter[0] - MARGIN, 43)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(MUTED)
    canvas.drawString(MARGIN, 29, doc.author)
    canvas.drawRightString(letter[0] - MARGIN, 29, str(doc.page))
    canvas.restoreState()


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    email = data["email"]
    document = SimpleDocTemplate(
        str(OUTPUT), pagesize=letter, leftMargin=MARGIN - 6, rightMargin=MARGIN - 6,
        topMargin=40, bottomMargin=52, title=f'{data["name"]} | Resume',
        author=data["name"], subject=data["title"],
    )
    story = [
        Paragraph(escape(data["name"]), NAME),
        Paragraph(escape(data["title"]), TITLE),
        Paragraph(f'{escape(data["location"])}  |  {link(email, "mailto:" + email)}', CONTACT),
        Paragraph("  |  ".join(link(item["label"], item["url"]) for item in data["profiles"]), CONTACT),
        Paragraph("Profile", HEADING),
        Paragraph(escape(data["summary"]), BODY),
        Paragraph("Technical Skills", HEADING),
        *(labeled(item["label"], item["detail"]) for item in data["skills"]),
        Paragraph("Selected Projects: Client Work", HEADING),
        *(project(item) for item in data["clientWork"]),
        PageBreak(),
        Paragraph(escape(data["name"]), CONTINUED),
        Paragraph("Selected Projects: AI Products &amp; Infrastructure", HEADING),
        *(project(item) for item in data["aiWork"]),
        Paragraph(escape(data["aiStatus"]), NOTE),
        Paragraph("Professional Experience", HEADING),
    ]
    for item in data["experience"]:
        story.append(KeepTogether([
            Paragraph(f'<b>{escape(item["role"])}</b> | {escape(item["company"])} | {escape(item["dates"])}', ENTRY),
            Paragraph(escape(item["detail"]), BODY),
        ]))
    story.append(Paragraph("Education &amp; Credentials", HEADING))
    story.extend(labeled(item["name"], item["detail"]) for item in data["education"])
    document.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    main()
