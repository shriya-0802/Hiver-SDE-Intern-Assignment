import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf():
    pdf_filename = "Apple_AI_Support_Agent_Report.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    PRIMARY = colors.HexColor("#0071e3")      # Apple Blue
    DARK_TEXT = colors.HexColor("#1d1d1f")    # Dark Charcoal
    MUTED_TEXT = colors.HexColor("#6e6e73")   # Muted Gray
    BG_LIGHT = colors.HexColor("#f5f5f7")     # Light Canvas Gray
    BORDER_COLOR = colors.HexColor("#d2d2d7") # Border Gray
    ACCENT_GREEN = colors.HexColor("#10b981")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=12,
        leading=16,
        textColor=MUTED_TEXT,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=DARK_TEXT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Custom',
        parent=body_style,
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=DARK_TEXT
    )

    story = []

    # Title Banner
    story.append(Paragraph("Apple Customer Support Assistant", title_style))
    story.append(Paragraph("<b>Hiver SDE Intern Take-Home Assignment Technical Report</b><br/>Author: Shriya Mohanty | Repository: https://github.com/shriya-0802/Hiver-SDE-Intern-Assignment.git", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=12))

    # Read README.md
    with open("README.md", "r", encoding="utf-8") as f:
        readme_text = f.read()

    # Parse Sections
    sections = readme_text.split("\n## ")

    for i, sec in enumerate(sections):
        if i == 0:
            continue
        lines = sec.strip().split("\n")
        header_title = lines[0].replace("#", "").strip()

        story.append(Paragraph(f"## {header_title}", h1_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=8))

        in_table = False
        table_rows = []

        for line in lines[1:]:
            line_str = line.strip()
            if not line_str:
                continue

            # Handle Markdown Callouts
            if line_str.startswith("> [!IMPORTANT]") or line_str.startswith("> [!NOTE]"):
                callout_text = line_str.replace("> [!IMPORTANT]", "<b>IMPORTANT:</b>").replace("> [!NOTE]", "<b>NOTE:</b>")
                callout_data = [[Paragraph(callout_text, callout_style)]]
                callout_table = Table(callout_data, colWidths=[530])
                callout_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbe6")),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#f59e0b")),
                    ('PADDING', (0,0), (-1,-1), 8),
                ]))
                story.append(callout_table)
                story.append(Spacer(1, 6))
                continue

            # Handle Blockquotes
            if line_str.startswith(">"):
                quote_text = line_str.lstrip(">").strip()
                story.append(Paragraph(f"<i>{quote_text}</i>", bullet_style))
                continue

            # Handle Table Lines
            if line_str.startswith("|") and line_str.endswith("|"):
                if "---" in line_str:
                    continue # Skip separator line
                cols = [c.strip() for c in line_str.split("|")[1:-1]]
                table_rows.append(cols)
                in_table = True
                continue
            else:
                if in_table and table_rows:
                    # Flush Table
                    col_count = len(table_rows[0])
                    col_width = 530 / col_count
                    table_data = []
                    for r_idx, row in enumerate(table_rows):
                        formatted_row = []
                        for cell in row:
                            cell_p = Paragraph(cell, table_header_style if r_idx == 0 else table_cell_style)
                            formatted_row.append(cell_p)
                        table_data.append(formatted_row)
                    
                    t = Table(table_data, colWidths=[col_width]*col_count)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
                        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
                        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
                        ('TOPPADDING', (0,0), (-1,-1), 5),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
                    ]))
                    story.append(t)
                    story.append(Spacer(1, 8))
                    table_rows = []
                    in_table = False

            # Handle Code Blocks
            if line_str.startswith("```"):
                continue

            # Handle Headers
            if line_str.startswith("### "):
                sub_title = line_str.replace("### ", "").strip()
                story.append(Paragraph(sub_title, h2_style))
                continue
            if line_str.startswith("#### "):
                sub_title = line_str.replace("#### ", "").strip()
                story.append(Paragraph(f"<b>{sub_title}</b>", body_style))
                continue

            # Handle Bullets
            if line_str.startswith("- ") or line_str.startswith("* "):
                item_text = line_str[2:].strip()
                item_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', item_text)
                item_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', item_text)
                story.append(Paragraph(f"• {item_text}", bullet_style))
                continue

            # Handle Numbered Lists
            if re.match(r'^\d+\.', line_str):
                item_text = re.sub(r'^\d+\.\s*', '', line_str)
                item_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', item_text)
                item_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', item_text)
                story.append(Paragraph(f"• {item_text}", bullet_style))
                continue

            # General Body Paragraph
            p_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_str)
            p_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', p_text)
            p_text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', p_text)
            story.append(Paragraph(p_text, body_style))

        # Flush any trailing table
        if in_table and table_rows:
            col_count = len(table_rows[0])
            col_width = 530 / col_count
            table_data = []
            for r_idx, row in enumerate(table_rows):
                formatted_row = []
                for cell in row:
                    cell_p = Paragraph(cell, table_header_style if r_idx == 0 else table_cell_style)
                    formatted_row.append(cell_p)
                table_data.append(formatted_row)
            
            t = Table(table_data, colWidths=[col_width]*col_count)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), PRIMARY),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t)
            story.append(Spacer(1, 8))

        story.append(Spacer(1, 10))

    # Page Number Canvas Callback
    def add_header_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(MUTED_TEXT)
        canvas.drawString(40, 20, "Apple Customer Support Assistant — Hiver SDE Intern Assignment Report")
        canvas.drawRightString(572, 20, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Successfully generated PDF: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
