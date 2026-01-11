import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// 한글 폰트 URL (로컬 폰트 우선, CDN 폴백)
const KOREAN_FONT_URL = '/fonts/NanumGothic.ttf';

// 회사 정보 타입
export interface CompanyInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  ceoName?: string;
  logoBase64?: string;
}

interface FormField {
  type: 'text' | 'multiline' | 'checkbox';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

// PDF 생성 클래스
export class PDFGenerator {
  private pdfDoc: PDFDocument | null = null;
  private font: PDFFont | null = null;
  private page: PDFPage | null = null;
  private currentY: number = 800;
  private margin: number = 50;
  private lineHeight: number = 20;
  private companyInfo: CompanyInfo | null = null;
  private logoImage: PDFImage | null = null;

  async init(companyInfo?: CompanyInfo, embedFont: boolean = true) {
    this.companyInfo = companyInfo || null;
    this.pdfDoc = await PDFDocument.create();
    this.pdfDoc.registerFontkit(fontkit);

    // 한글 폰트 로드 (embedFont가 false면 기본 폰트만 사용)
    if (embedFont) {
      try {
        const fontBytes = await fetch(KOREAN_FONT_URL).then(res => res.arrayBuffer());
        this.font = await this.pdfDoc.embedFont(fontBytes);
      } catch {
        // 폰트 로드 실패 시 기본 폰트 사용
        this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } else {
      // 가벼운 버전: 기본 폰트만 사용
      this.font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    this.page = this.pdfDoc.addPage([595.28, 841.89]); // A4 사이즈
    this.currentY = 800;

    // 로고 로드
    if (companyInfo?.logoBase64) {
      try {
        const logoData = companyInfo.logoBase64.split(',')[1];
        const logoBytes = Uint8Array.from(atob(logoData), c => c.charCodeAt(0));

        if (companyInfo.logoBase64.includes('image/png')) {
          this.logoImage = await this.pdfDoc.embedPng(logoBytes);
        } else {
          this.logoImage = await this.pdfDoc.embedJpg(logoBytes);
        }
      } catch (e) {
        console.error('로고 로드 실패:', e);
        this.logoImage = null;
      }
    }
  }

  // 헤더 그리기 (로고 + 회사명)
  private drawHeader() {
    if (!this.page || !this.font) return;

    const pageWidth = 595.28;
    let headerHeight = 0;

    // 로고 그리기
    if (this.logoImage) {
      const logoSize = 50;
      const logoDims = this.logoImage.scale(logoSize / Math.max(this.logoImage.width, this.logoImage.height));
      this.page.drawImage(this.logoImage, {
        x: this.margin,
        y: this.currentY - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
      headerHeight = Math.max(headerHeight, logoDims.height);
    }

    // 회사명 그리기
    if (this.companyInfo?.name) {
      const textX = this.logoImage ? this.margin + 60 : this.margin;
      this.page.drawText(this.companyInfo.name, {
        x: textX,
        y: this.currentY - 20,
        size: 14,
        font: this.font,
        color: rgb(0.2, 0.2, 0.2),
      });

      // 회사 연락처
      if (this.companyInfo.phone || this.companyInfo.email) {
        const contactText = [this.companyInfo.phone, this.companyInfo.email].filter(Boolean).join(' | ');
        this.page.drawText(contactText, {
          x: textX,
          y: this.currentY - 38,
          size: 8,
          font: this.font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      headerHeight = Math.max(headerHeight, 45);
    }

    if (headerHeight > 0) {
      // 헤더 구분선
      this.currentY -= headerHeight + 10;
      this.page.drawLine({
        start: { x: this.margin, y: this.currentY },
        end: { x: pageWidth - this.margin, y: this.currentY },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8),
      });
      this.currentY -= 20;
    }
  }

  // 푸터 그리기
  private drawFooter() {
    if (!this.page || !this.font || !this.companyInfo) return;

    const pageWidth = 595.28;
    const footerY = 40;

    // 구분선
    this.page.drawLine({
      start: { x: this.margin, y: footerY + 15 },
      end: { x: pageWidth - this.margin, y: footerY + 15 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // 회사 정보
    const footerText = [
      this.companyInfo.name,
      this.companyInfo.address,
      this.companyInfo.phone ? `Tel: ${this.companyInfo.phone}` : null,
      this.companyInfo.email ? `Email: ${this.companyInfo.email}` : null,
    ].filter(Boolean).join(' | ');

    this.page.drawText(footerText, {
      x: this.margin,
      y: footerY,
      size: 7,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  private drawText(text: string, x: number, y: number, size: number = 10) {
    if (!this.page || !this.font) return;
    this.page.drawText(text, {
      x,
      y,
      size,
      font: this.font,
      color: rgb(0, 0, 0),
    });
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number) {
    if (!this.page) return;
    this.page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: 0.5,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  private drawRect(x: number, y: number, width: number, height: number, fill: boolean = false) {
    if (!this.page) return;
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 0.5,
      color: fill ? rgb(0.95, 0.95, 0.95) : undefined,
    });
  }

  private addTextField(name: string, x: number, y: number, width: number, height: number) {
    if (!this.pdfDoc || !this.page) return;
    const form = this.pdfDoc.getForm();
    const textField = form.createTextField(name);
    textField.addToPage(this.page, { x, y, width, height, borderWidth: 1 });
    textField.enableMultiline();
  }

  private addCheckbox(name: string, x: number, y: number) {
    if (!this.pdfDoc || !this.page) return;
    const form = this.pdfDoc.getForm();
    const checkbox = form.createCheckBox(name);
    checkbox.addToPage(this.page, { x, y, width: 12, height: 12 });
  }

  private newPage() {
    if (!this.pdfDoc) return;
    this.page = this.pdfDoc.addPage([595.28, 841.89]);
    this.currentY = 800;
  }

  // 테이블 셀 그리기 헬퍼
  private drawTableCell(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    options: {
      isHeader?: boolean;
      align?: 'left' | 'center' | 'right';
      fontSize?: number;
      padding?: number;
    } = {}
  ) {
    if (!this.page || !this.font) return;

    const { isHeader = false, align = 'center', fontSize = 9, padding = 5 } = options;

    // 셀 배경 (헤더인 경우 회색)
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
      color: isHeader ? rgb(0.93, 0.93, 0.93) : undefined,
    });

    // 텍스트 위치 계산
    const textWidth = this.font.widthOfTextAtSize(text, fontSize);
    let textX = x + padding;
    if (align === 'center') {
      textX = x + (width - textWidth) / 2;
    } else if (align === 'right') {
      textX = x + width - textWidth - padding;
    }

    this.page.drawText(text, {
      x: textX,
      y: y + (height - fontSize) / 2,
      size: fontSize,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  // 테이블 입력 필드 셀
  private drawTableInputCell(
    x: number,
    y: number,
    width: number,
    height: number,
    fieldName: string
  ) {
    if (!this.page || !this.pdfDoc) return;

    // 셀 테두리
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });

    // 입력 필드 (패딩 적용)
    const form = this.pdfDoc.getForm();
    const field = form.createTextField(fieldName);
    field.addToPage(this.page, {
      x: x + 2,
      y: y + 2,
      width: width - 4,
      height: height - 4,
      borderWidth: 0,
    });
  }

  // 이력서 PDF 생성 (전문적인 디자인)
  async generateResume(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '이  력  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });

    // 제목 밑줄
    const underlineY = this.currentY - 5;
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: underlineY },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: underlineY },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });

    this.currentY -= 40;

    // === 인적사항 테이블 ===
    const tableX = margin;
    let tableY = this.currentY;
    const rowHeight = 28;
    const labelWidth = 70;
    const photoWidth = 85;
    const photoHeight = rowHeight * 4;

    // 첫 번째 행: 성명, 한자, 사진
    this.drawTableCell(tableX, tableY - rowHeight, labelWidth, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth, tableY - rowHeight, 120, rowHeight, 'name');
    this.drawTableCell(tableX + labelWidth + 120, tableY - rowHeight, 50, rowHeight, '한 자', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth + 170, tableY - rowHeight, 90, rowHeight, 'name_hanja');

    // 사진 영역 (4줄 병합)
    this.page.drawRectangle({
      x: tableX + contentWidth - photoWidth,
      y: tableY - photoHeight,
      width: photoWidth,
      height: photoHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    const photoText = '사 진';
    const photoTextWidth = this.font.widthOfTextAtSize(photoText, 10);
    this.page.drawText(photoText, {
      x: tableX + contentWidth - photoWidth / 2 - photoTextWidth / 2,
      y: tableY - photoHeight / 2 - 5,
      size: 10,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });
    const photoSubText = '(3×4cm)';
    const photoSubWidth = this.font.widthOfTextAtSize(photoSubText, 8);
    this.page.drawText(photoSubText, {
      x: tableX + contentWidth - photoWidth / 2 - photoSubWidth / 2,
      y: tableY - photoHeight / 2 - 20,
      size: 8,
      font: this.font,
      color: rgb(0.5, 0.5, 0.5),
    });

    tableY -= rowHeight;

    // 두 번째 행: 생년월일, 성별
    this.drawTableCell(tableX, tableY - rowHeight, labelWidth, rowHeight, '생년월일', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth, tableY - rowHeight, 170, rowHeight, 'birthdate');
    this.drawTableCell(tableX + labelWidth + 170, tableY - rowHeight, 50, rowHeight, '성 별', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth + 220, tableY - rowHeight, 40, rowHeight, 'gender');
    tableY -= rowHeight;

    // 세 번째 행: 연락처, 이메일
    this.drawTableCell(tableX, tableY - rowHeight, labelWidth, rowHeight, '연 락 처', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth, tableY - rowHeight, 120, rowHeight, 'phone');
    this.drawTableCell(tableX + labelWidth + 120, tableY - rowHeight, 50, rowHeight, '이메일', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth + 170, tableY - rowHeight, 90, rowHeight, 'email');
    tableY -= rowHeight;

    // 네 번째 행: 주소 (전체 너비)
    this.drawTableCell(tableX, tableY - rowHeight, labelWidth, rowHeight, '주    소', { isHeader: true });
    this.drawTableInputCell(tableX + labelWidth, tableY - rowHeight, contentWidth - labelWidth - photoWidth, rowHeight, 'address');
    tableY -= rowHeight;

    tableY -= 15;

    // === 학력사항 ===
    this.page.drawText('학 력 사 항', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    tableY -= 5;

    // 학력 헤더
    const eduColWidths = [100, 150, 130, 135];
    let eduX = margin;
    const eduHeaders = ['기 간', '학 교 명', '전공/계열', '졸업구분'];

    eduHeaders.forEach((header, i) => {
      this.drawTableCell(eduX, tableY - rowHeight, eduColWidths[i], rowHeight, header, { isHeader: true });
      eduX += eduColWidths[i];
    });
    tableY -= rowHeight;

    // 학력 입력 행 (4행)
    for (let i = 1; i <= 4; i++) {
      eduX = margin;
      this.drawTableInputCell(eduX, tableY - rowHeight, eduColWidths[0], rowHeight, `edu_period_${i}`);
      eduX += eduColWidths[0];
      this.drawTableInputCell(eduX, tableY - rowHeight, eduColWidths[1], rowHeight, `edu_school_${i}`);
      eduX += eduColWidths[1];
      this.drawTableInputCell(eduX, tableY - rowHeight, eduColWidths[2], rowHeight, `edu_major_${i}`);
      eduX += eduColWidths[2];
      this.drawTableInputCell(eduX, tableY - rowHeight, eduColWidths[3], rowHeight, `edu_status_${i}`);
      tableY -= rowHeight;
    }

    tableY -= 15;

    // === 경력사항 ===
    this.page.drawText('경 력 사 항', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    tableY -= 5;

    // 경력 헤더
    const careerColWidths = [90, 130, 100, 100, 95];
    let careerX = margin;
    const careerHeaders = ['근무기간', '회 사 명', '부서/직급', '담당업무', '퇴사사유'];

    careerHeaders.forEach((header, i) => {
      this.drawTableCell(careerX, tableY - rowHeight, careerColWidths[i], rowHeight, header, { isHeader: true });
      careerX += careerColWidths[i];
    });
    tableY -= rowHeight;

    // 경력 입력 행 (3행)
    for (let i = 1; i <= 3; i++) {
      careerX = margin;
      careerColWidths.forEach((width, j) => {
        const fieldNames = ['career_period', 'career_company', 'career_position', 'career_task', 'career_reason'];
        this.drawTableInputCell(careerX, tableY - rowHeight, width, rowHeight, `${fieldNames[j]}_${i}`);
        careerX += width;
      });
      tableY -= rowHeight;
    }

    tableY -= 15;

    // === 자격 및 면허 ===
    this.page.drawText('자 격 및 면 허', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    tableY -= 5;

    // 자격 헤더
    const certColWidths = [100, 200, 215];
    let certX = margin;
    const certHeaders = ['취 득 일', '자격/면허명', '발급기관'];

    certHeaders.forEach((header, i) => {
      this.drawTableCell(certX, tableY - rowHeight, certColWidths[i], rowHeight, header, { isHeader: true });
      certX += certColWidths[i];
    });
    tableY -= rowHeight;

    // 자격 입력 행 (3행)
    for (let i = 1; i <= 3; i++) {
      certX = margin;
      const certFieldNames = ['cert_date', 'cert_name', 'cert_issuer'];
      certColWidths.forEach((width, j) => {
        this.drawTableInputCell(certX, tableY - rowHeight, width, rowHeight, `${certFieldNames[j]}_${i}`);
        certX += width;
      });
      tableY -= rowHeight;
    }

    tableY -= 15;

    // === 어학능력 ===
    this.page.drawText('어 학 능 력', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    tableY -= 5;

    // 어학 헤더
    const langColWidths = [80, 150, 130, 155];
    let langX = margin;
    const langHeaders = ['언 어', '시험명/자격명', '점수/등급', '취득일'];

    langHeaders.forEach((header, i) => {
      this.drawTableCell(langX, tableY - rowHeight, langColWidths[i], rowHeight, header, { isHeader: true });
      langX += langColWidths[i];
    });
    tableY -= rowHeight;

    // 어학 입력 행 (2행)
    for (let i = 1; i <= 2; i++) {
      langX = margin;
      const langFieldNames = ['lang_type', 'lang_test', 'lang_score', 'lang_date'];
      langColWidths.forEach((width, j) => {
        this.drawTableInputCell(langX, tableY - rowHeight, width, rowHeight, `${langFieldNames[j]}_${i}`);
        langX += width;
      });
      tableY -= rowHeight;
    }

    // === 서명란 ===
    tableY -= 25;

    const confirmText = '위 기재 사항은 사실과 다름없음을 확인합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 10);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });

    tableY -= 30;

    // 날짜
    this.page.drawText('작 성 일 :', {
      x: pageWidth / 2 - 120,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.drawTableInputCell(pageWidth / 2 - 70, tableY - 5, 150, 22, 'sign_date');

    tableY -= 30;

    // 작성자
    this.page.drawText('작 성 자 :', {
      x: pageWidth / 2 - 120,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.drawTableInputCell(pageWidth / 2 - 70, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', {
      x: pageWidth / 2 + 45,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 자기소개서 PDF 생성 (전문적인 디자인)
  async generateCoverLetter(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '자 기 소 개 서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 기본 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '지원분야', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'position');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'name');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '연 락 처', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'phone');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '이 메 일', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'email');
    tableY -= rowHeight + 20;

    // === 각 섹션 (테이블 형식) ===
    const sections = [
      { title: '성 장 과 정', name: 'growth', height: 130 },
      { title: '성격의 장단점', name: 'personality', height: 130 },
      { title: '지 원 동 기', name: 'motivation', height: 130 },
      { title: '입사 후 포부', name: 'aspiration', height: 130 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      // 섹션 헤더
      this.drawTableCell(margin, tableY - 30, contentWidth, 30, section.title, { isHeader: true, fontSize: 11 });
      tableY -= 30;

      // 내용 입력 영역
      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 서명란 ===
    tableY -= 15;
    const confirmText = '위 기재 사항은 사실과 다름없음을 확인합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 10);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    tableY -= 30;

    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('작 성 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 서약서 PDF 생성 (전문적인 디자인)
  async generatePledge(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '복 무 서 약 서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 50;

    // === 작성자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '입 사 일', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'hire_date');
    tableY -= rowHeight + 30;

    // === 본문 (테두리 박스 안에) ===
    const companyName = companyInfo?.name || '주식회사 ○○○○';
    const contentLines = [
      `본인은 ${companyName}(이하 "회사")에 입사함에 있어`,
      '다음 사항을 준수할 것을 서약합니다.',
    ];

    contentLines.forEach((line) => {
      this.page!.drawText(line, {
        x: margin + 20,
        y: tableY,
        size: 11,
        font: this.font!,
        color: rgb(0.15, 0.15, 0.15),
      });
      tableY -= 20;
    });

    tableY -= 15;

    // 서약 항목들
    const pledgeItems = [
      '1. 본인은 회사의 취업규칙 및 제반 규정을 성실히 준수하겠습니다.',
      '',
      '2. 본인은 직무상 알게 된 회사의 기밀사항을 재직 중은 물론 퇴직 후에도',
      '    외부에 누설하거나 타 목적으로 사용하지 않겠습니다.',
      '',
      '3. 본인은 회사의 영업비밀, 고객정보, 기술정보 등을 부당하게 취득하거나',
      '    사용하지 않겠습니다.',
      '',
      '4. 본인은 회사의 명예와 신용을 손상시키는 행위를 하지 않겠습니다.',
      '',
      '5. 본인은 상기 사항을 위반하여 회사에 손해를 끼친 경우,',
      '    민·형사상 책임을 지겠습니다.',
    ];

    // 서약 내용 박스
    const boxStartY = tableY + 10;
    const boxHeight = pledgeItems.length * 22 + 30;
    this.page.drawRectangle({
      x: margin,
      y: tableY - boxHeight + 20,
      width: contentWidth,
      height: boxHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });

    pledgeItems.forEach((line) => {
      if (line) {
        this.page!.drawText(line, {
          x: margin + 15,
          y: tableY,
          size: 10,
          font: this.font!,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      tableY -= 22;
    });

    tableY -= 40;

    // === 확인 문구 ===
    const confirmText = '위 사항을 성실히 준수할 것을 서약합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 11);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });

    tableY -= 40;

    // === 서명란 ===
    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 35;

    this.page.drawText('서 약 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 경위서 PDF 생성 (전문적인 디자인)
  async generateStatement(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '경  위  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 50;

    // === 작성자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '연 락 처', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'phone');
    tableY -= rowHeight + 25;

    // 본문
    this.page.drawText('상기 본인은 아래와 같이 경위를 보고합니다.', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    // === 사건 개요 테이블 ===
    this.drawTableCell(margin, tableY - rowHeight, 120, rowHeight, '사건 발생 일시', { isHeader: true });
    this.drawTableInputCell(margin + 120, tableY - rowHeight, contentWidth - 120, rowHeight, 'incident_date');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 120, rowHeight, '사건 발생 장소', { isHeader: true });
    this.drawTableInputCell(margin + 120, tableY - rowHeight, contentWidth - 120, rowHeight, 'incident_place');
    tableY -= rowHeight + 15;

    // === 상세 내용 섹션들 ===
    const sections = [
      { title: '사 건 개 요', name: 'incident_summary', height: 80 },
      { title: '사건 경위 (시간 순서대로 상세히 기술)', name: 'incident_detail', height: 150 },
      { title: '관 련 자', name: 'related_persons', height: 50 },
      { title: '증빙자료 (있는 경우)', name: 'evidence', height: 50 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      // 섹션 헤더
      this.drawTableCell(margin, tableY - 26, contentWidth, 26, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 26;

      // 내용 입력 영역
      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 서명란 ===
    tableY -= 10;
    const confirmText = '위 내용이 사실과 다름없음을 확인합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 10);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    tableY -= 30;

    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('작 성 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 시말서 PDF 생성 (전문적인 디자인)
  async generateApology(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '시  말  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 50;

    // === 작성자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '사    번', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'employee_id');
    tableY -= rowHeight + 20;

    // === 사건 기본 정보 테이블 ===
    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '일    시', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, contentWidth - 80, rowHeight, 'incident_date');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '장    소', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, contentWidth - 80, rowHeight, 'incident_place');
    tableY -= rowHeight + 15;

    // === 상세 내용 섹션들 ===
    const sections = [
      { title: '사 건 내 용', name: 'content', height: 100 },
      { title: '본인의 잘못 및 반성', name: 'fault', height: 100 },
      { title: '향 후 대 책', name: 'plan', height: 100 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      // 섹션 헤더
      this.drawTableCell(margin, tableY - 26, contentWidth, 26, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 26;

      // 내용 입력 영역
      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 확인 문구 (박스 안에) ===
    tableY -= 5;
    const confirmLines = [
      '위와 같이 잘못을 인정하며, 향후 같은 일이 발생하지 않도록',
      '각별히 주의하겠습니다.',
    ];
    const boxHeight = 55;
    this.page.drawRectangle({
      x: margin,
      y: tableY - boxHeight,
      width: contentWidth,
      height: boxHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
      color: rgb(0.98, 0.98, 0.98),
    });
    confirmLines.forEach((line, i) => {
      const lineWidth = this.font!.widthOfTextAtSize(line, 10);
      this.page!.drawText(line, {
        x: (pageWidth - lineWidth) / 2,
        y: tableY - 20 - i * 18,
        size: 10,
        font: this.font!,
        color: rgb(0.15, 0.15, 0.15),
      });
    });
    tableY -= boxHeight + 25;

    // === 서명란 ===
    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('작 성 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 동의서 PDF 생성 (전문적인 디자인)
  async generateConsent(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '개인정보 수집·이용 동의서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 20);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 20,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 동의자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '생년월일', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'birthdate');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '연 락 처', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 445, rowHeight, 'phone');
    tableY -= rowHeight + 20;

    // === 안내 문구 ===
    const companyName = companyInfo?.name || '주식회사 ○○○○';
    this.page.drawText(`${companyName}(이하 "회사")는 「개인정보보호법」에 따라`, {
      x: margin,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 18;
    this.page.drawText('귀하의 개인정보를 다음과 같이 수집·이용하고자 합니다.', {
      x: margin,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    // === 각 항목 테이블 형식 ===
    const sections = [
      {
        title: '1. 개인정보의 수집·이용 목적',
        items: [
          '• 인사관리 (채용, 급여, 복리후생, 교육 등)',
          '• 근로계약 체결 및 이행',
          '• 4대 보험 가입 및 관리',
          '• 법정 의무 이행',
        ],
      },
      {
        title: '2. 수집하는 개인정보의 항목',
        items: [
          '• 필수항목: 성명, 생년월일, 주소, 연락처, 학력, 경력사항',
          '• 선택항목: 가족관계, 병역사항, 자격증',
        ],
      },
      {
        title: '3. 개인정보의 보유 및 이용 기간',
        items: [
          '• 근로관계 종료 시까지',
          '• 단, 법령에 따른 보존 기간이 있는 경우 해당 기간',
        ],
      },
      {
        title: '4. 동의를 거부할 권리 및 거부 시 불이익',
        items: [
          '• 귀하는 위 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.',
          '• 다만, 필수항목에 대한 동의 거부 시 채용 및 인사관리에 제한이 있을 수 있습니다.',
        ],
      },
    ];

    sections.forEach((section) => {
      // 섹션 헤더
      this.drawTableCell(margin, tableY - 24, contentWidth, 24, section.title, { isHeader: true, fontSize: 10, align: 'left', padding: 10 });
      tableY -= 24;

      // 내용
      const itemHeight = section.items.length * 16 + 10;
      this.page!.drawRectangle({
        x: margin,
        y: tableY - itemHeight,
        width: contentWidth,
        height: itemHeight,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      section.items.forEach((item, i) => {
        this.page!.drawText(item, {
          x: margin + 10,
          y: tableY - 15 - i * 16,
          size: 9,
          font: this.font!,
          color: rgb(0.2, 0.2, 0.2),
        });
      });

      tableY -= itemHeight + 10;
    });

    // === 동의 확인 박스 ===
    tableY -= 5;
    const confirmBoxHeight = 80;
    this.page.drawRectangle({
      x: margin,
      y: tableY - confirmBoxHeight,
      width: contentWidth,
      height: confirmBoxHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
      color: rgb(0.98, 0.98, 0.98),
    });

    this.page.drawText('위 내용을 충분히 이해하였으며, 개인정보 수집·이용에 동의합니다.', {
      x: margin + 15,
      y: tableY - 20,
      size: 10,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });

    // 체크박스 - 필수
    this.addCheckbox('consent_required', margin + 30, tableY - 50);
    this.page.drawText('필수항목 수집·이용에 동의합니다.', {
      x: margin + 50,
      y: tableY - 47,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // 체크박스 - 선택
    this.addCheckbox('consent_optional', margin + 280, tableY - 50);
    this.page.drawText('선택항목 수집·이용에 동의합니다.', {
      x: margin + 300,
      y: tableY - 47,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });

    tableY -= confirmBoxHeight + 25;

    // === 서명란 ===
    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('동 의 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 진술서 PDF 생성 (전문적인 디자인)
  async generateTestimony(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '진  술  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 진술인 정보 섹션 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '진 술 인  정 보', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '연 락 처', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'phone');
    tableY -= rowHeight + 15;

    // === 진술 내용 섹션 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '진 술  내 용', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    // 사건 기본 정보
    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '사건 일시', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'incident_date');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '사건 장소', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'incident_place');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '관 련 자', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'related_persons');
    tableY -= rowHeight + 15;

    // === 상세 내용 섹션들 ===
    const sections = [
      { title: '목격 또는 인지한 내용 (상세히 기술)', name: 'witness_content', height: 180 },
      { title: '기타 참고 사항', name: 'remarks', height: 80 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      // 섹션 헤더
      this.drawTableCell(margin, tableY - 26, contentWidth, 26, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 26;

      // 내용 입력 영역
      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 서명란 ===
    tableY -= 5;
    const confirmText = '위 진술 내용이 사실과 다름없음을 확인합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 10);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    tableY -= 30;

    this.page.drawText('진 술 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('진 술 인 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 징계위원회 회의록 PDF 생성 (전문적인 디자인)
  async generateMeetingMinutes(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '징계위원회 회의록';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 20);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 20,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 회의 개요 섹션 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '회 의  개 요', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '일    시', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, contentWidth - 80, rowHeight, 'meeting_date');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '장    소', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, contentWidth - 80, rowHeight, 'meeting_place');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '참 석 자', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, contentWidth - 80, rowHeight, 'attendees');
    tableY -= rowHeight + 15;

    // === 안건 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '안    건', { isHeader: true, fontSize: 11 });
    tableY -= 24;
    this.page.drawRectangle({
      x: margin,
      y: tableY - 50,
      width: contentWidth,
      height: 50,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    const agendaField = this.pdfDoc.getForm().createTextField('agenda');
    agendaField.addToPage(this.page, { x: margin + 3, y: tableY - 47, width: contentWidth - 6, height: 44, borderWidth: 0 });
    agendaField.enableMultiline();
    tableY -= 50 + 15;

    // === 징계 대상자 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '징 계  대 상 자', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, 170, rowHeight, 'target_dept');
    this.drawTableCell(margin + 250, tableY - rowHeight, 80, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 330, tableY - rowHeight, 185, rowHeight, 'target_position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 80, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - rowHeight, 170, rowHeight, 'target_name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 80, rowHeight, '사    번', { isHeader: true });
    this.drawTableInputCell(margin + 330, tableY - rowHeight, 185, rowHeight, 'target_id');
    tableY -= rowHeight + 15;

    // === 상세 섹션들 ===
    const sections = [
      { title: '징 계  사 유', name: 'discipline_reason', height: 70 },
      { title: '대상자 소명 내용', name: 'explanation', height: 70 },
      { title: '심 의  내 용', name: 'deliberation', height: 70 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      this.drawTableCell(margin, tableY - 24, contentWidth, 24, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 24;

      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, { x: margin + 3, y: tableY - section.height + 3, width: contentWidth - 6, height: section.height - 6, borderWidth: 0 });
      field.enableMultiline();

      tableY -= section.height + 12;
    });

    // === 의결 내용 ===
    if (tableY < 200) {
      this.newPage();
      tableY = 780;
    }

    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '의 결  내 용', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '징계 종류', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'discipline_type');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '징계 기간', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'discipline_period');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '의결 결과', { isHeader: true });
    // 찬성/반대 입력 영역
    this.page.drawRectangle({
      x: margin + 100,
      y: tableY - rowHeight,
      width: contentWidth - 100,
      height: rowHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    this.page.drawText('찬성', { x: margin + 115, y: tableY - rowHeight + 9, size: 9, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(margin + 145, tableY - rowHeight + 3, 50, rowHeight - 6, 'vote_yes');
    this.page.drawText('명  /  반대', { x: margin + 210, y: tableY - rowHeight + 9, size: 9, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(margin + 275, tableY - rowHeight + 3, 50, rowHeight - 6, 'vote_no');
    this.page.drawText('명', { x: margin + 340, y: tableY - rowHeight + 9, size: 9, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    tableY -= rowHeight + 15;

    // === 기타 사항 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '기 타  사 항', { isHeader: true, fontSize: 10 });
    tableY -= 24;
    this.page.drawRectangle({
      x: margin,
      y: tableY - 60,
      width: contentWidth,
      height: 60,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    const remarksField = this.pdfDoc.getForm().createTextField('remarks');
    remarksField.addToPage(this.page, { x: margin + 3, y: tableY - 57, width: contentWidth - 6, height: 54, borderWidth: 0 });
    remarksField.enableMultiline();
    tableY -= 60 + 25;

    // === 서명란 테이블 ===
    this.page.drawText('작 성 일 :', { x: margin, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(margin + 60, tableY - 5, 150, 22, 'sign_date');
    tableY -= 35;

    // 서명란 테이블
    const signRowHeight = 26;
    this.drawTableCell(margin, tableY - signRowHeight, 80, signRowHeight, '위 원 장', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - signRowHeight, 120, signRowHeight, 'chairman');
    this.drawTableCell(margin + 200, tableY - signRowHeight, 50, signRowHeight, '(인)', { isHeader: false });

    this.drawTableCell(margin + 260, tableY - signRowHeight, 80, signRowHeight, '위    원', { isHeader: true });
    this.drawTableInputCell(margin + 340, tableY - signRowHeight, 120, signRowHeight, 'member1');
    this.drawTableCell(margin + 460, tableY - signRowHeight, 55, signRowHeight, '(인)', { isHeader: false });
    tableY -= signRowHeight;

    this.drawTableCell(margin, tableY - signRowHeight, 80, signRowHeight, '위    원', { isHeader: true });
    this.drawTableInputCell(margin + 80, tableY - signRowHeight, 120, signRowHeight, 'member2');
    this.drawTableCell(margin + 200, tableY - signRowHeight, 50, signRowHeight, '(인)', { isHeader: false });

    this.drawTableCell(margin + 260, tableY - signRowHeight, 80, signRowHeight, '위    원', { isHeader: true });
    this.drawTableInputCell(margin + 340, tableY - signRowHeight, 120, signRowHeight, 'member3');
    this.drawTableCell(margin + 460, tableY - signRowHeight, 55, signRowHeight, '(인)', { isHeader: false });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 징계 통보서 PDF 생성 (전문적인 디자인)
  async generateDisciplineNotice(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '징 계 통 보 서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 수신인 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '수    신', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'recipient_dept');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'recipient_position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'recipient_name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '사    번', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'recipient_id');
    tableY -= rowHeight + 20;

    // 안내 문구
    const companyName = companyInfo?.name || '당사';
    this.page.drawText(`${companyName} 징계위원회는 귀하에 대하여 아래와 같이 징계 처분을 결정하였기에 통보합니다.`, {
      x: margin,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    // === 징계 내용 섹션들 ===
    const sections = [
      { title: '징 계  사 유', name: 'discipline_reason', height: 80 },
      { title: '관 련  규 정', name: 'related_rules', height: 50 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      this.drawTableCell(margin, tableY - 24, contentWidth, 24, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 24;

      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, { x: margin + 3, y: tableY - section.height + 3, width: contentWidth - 6, height: section.height - 6, borderWidth: 0 });
      field.enableMultiline();

      tableY -= section.height + 12;
    });

    // === 징계 결정 테이블 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '징 계  결 정', { isHeader: true, fontSize: 11 });
    tableY -= 24;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '징계 종류', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'discipline_type');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '징계 기간', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'discipline_period');
    tableY -= rowHeight + 12;

    // === 징계 내용 상세 ===
    this.drawTableCell(margin, tableY - 24, contentWidth, 24, '징 계  내 용', { isHeader: true, fontSize: 10 });
    tableY -= 24;
    this.page.drawRectangle({
      x: margin,
      y: tableY - 80,
      width: contentWidth,
      height: 80,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
    });
    const contentField = this.pdfDoc.getForm().createTextField('discipline_content');
    contentField.addToPage(this.page, { x: margin + 3, y: tableY - 77, width: contentWidth - 6, height: 74, borderWidth: 0 });
    contentField.enableMultiline();
    tableY -= 80 + 15;

    // === 이의 신청 안내 박스 ===
    const appealBoxHeight = 55;
    this.page.drawRectangle({
      x: margin,
      y: tableY - appealBoxHeight,
      width: contentWidth,
      height: appealBoxHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
      color: rgb(0.98, 0.98, 0.98),
    });
    this.page.drawText('【이의 신청 안내】', {
      x: margin + 10,
      y: tableY - 18,
      size: 10,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    this.page.drawText('본 징계 처분에 이의가 있는 경우, 통보일로부터 7일 이내에 서면으로 재심을 청구할 수 있습니다.', {
      x: margin + 10,
      y: tableY - 38,
      size: 9,
      font: this.font,
      color: rgb(0.3, 0.3, 0.3),
    });
    tableY -= appealBoxHeight + 25;

    // === 서명란 ===
    this.page.drawText('통 보 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'notice_date');
    tableY -= 40;

    const ceoCompanyName = companyInfo?.name || '주식회사 ○○○○';
    const ceoName = companyInfo?.ceoName || '';
    this.page.drawText(ceoCompanyName, {
      x: pageWidth / 2 - 60,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    this.page.drawText('대 표 이 사 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    if (ceoName) {
      this.page.drawText(ceoName, { x: pageWidth / 2 - 55, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    } else {
      this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'ceo_name');
    }
    this.page.drawText('(직인)', { x: pageWidth / 2 + 60, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 소명서 PDF 생성 (전문적인 디자인)
  async generateExplanation(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '소  명  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 작성자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '사    번', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'employee_id');
    tableY -= rowHeight + 20;

    // 안내 문구
    this.page.drawText('상기 본인은 아래 사항에 대하여 다음과 같이 소명합니다.', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    // === 소명 대상 테이블 ===
    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '소명 대상', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'subject');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '관련 일시', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'related_date');
    tableY -= rowHeight + 15;

    // === 상세 내용 섹션들 ===
    const sections = [
      { title: '소 명  내 용 (상세히 기술)', name: 'explanation_content', height: 180 },
      { title: '증빙자료 (첨부 시 목록 기재)', name: 'evidence', height: 60 },
      { title: '참 고  사 항', name: 'remarks', height: 60 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      this.drawTableCell(margin, tableY - 26, contentWidth, 26, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 26;

      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 서명란 ===
    tableY -= 5;
    const confirmText = '위 소명 내용이 사실과 다름없음을 확인합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 10);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY,
      size: 10,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });
    tableY -= 30;

    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('작 성 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }

  // 사직서 PDF 생성 (전문적인 디자인)
  async generateResignation(companyInfo?: CompanyInfo): Promise<Uint8Array> {
    await this.init(companyInfo);
    if (!this.pdfDoc || !this.page || !this.font) throw new Error('PDF not initialized');

    const pageWidth = 595.28;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const rowHeight = 28;

    // 회사 헤더
    this.drawHeader();

    // === 제목 ===
    const titleText = '사  직  서';
    const titleWidth = this.font.widthOfTextAtSize(titleText, 22);
    this.page.drawText(titleText, {
      x: (pageWidth - titleWidth) / 2,
      y: this.currentY,
      size: 22,
      font: this.font,
      color: rgb(0.1, 0.1, 0.1),
    });
    this.page.drawLine({
      start: { x: (pageWidth - titleWidth) / 2 - 10, y: this.currentY - 5 },
      end: { x: (pageWidth + titleWidth) / 2 + 10, y: this.currentY - 5 },
      thickness: 2,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.currentY -= 45;

    // === 작성자 정보 테이블 ===
    let tableY = this.currentY;
    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '소    속', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'department');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '직    위', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'position');
    tableY -= rowHeight;

    this.drawTableCell(margin, tableY - rowHeight, 70, rowHeight, '성    명', { isHeader: true });
    this.drawTableInputCell(margin + 70, tableY - rowHeight, 180, rowHeight, 'name');
    this.drawTableCell(margin + 250, tableY - rowHeight, 70, rowHeight, '입 사 일', { isHeader: true });
    this.drawTableInputCell(margin + 320, tableY - rowHeight, 195, rowHeight, 'hire_date');
    tableY -= rowHeight + 20;

    // 안내 문구
    this.page.drawText('상기 본인은 아래와 같은 사유로 사직하고자 합니다.', {
      x: margin,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= 25;

    // === 희망 퇴직일 ===
    this.drawTableCell(margin, tableY - rowHeight, 100, rowHeight, '희망 퇴직일', { isHeader: true });
    this.drawTableInputCell(margin + 100, tableY - rowHeight, contentWidth - 100, rowHeight, 'resignation_date');
    tableY -= rowHeight + 15;

    // === 상세 내용 섹션들 ===
    const sections = [
      { title: '사 직  사 유', name: 'resignation_reason', height: 120 },
      { title: '인 수 인 계  계 획', name: 'handover_plan', height: 120 },
    ];

    sections.forEach((section) => {
      if (tableY < section.height + 80) {
        this.newPage();
        tableY = 780;
      }

      this.drawTableCell(margin, tableY - 26, contentWidth, 26, section.title, { isHeader: true, fontSize: 10 });
      tableY -= 26;

      this.page!.drawRectangle({
        x: margin,
        y: tableY - section.height,
        width: contentWidth,
        height: section.height,
        borderColor: rgb(0.3, 0.3, 0.3),
        borderWidth: 0.5,
      });

      const form = this.pdfDoc!.getForm();
      const field = form.createTextField(section.name);
      field.addToPage(this.page!, {
        x: margin + 3,
        y: tableY - section.height + 3,
        width: contentWidth - 6,
        height: section.height - 6,
        borderWidth: 0,
      });
      field.enableMultiline();

      tableY -= section.height + 15;
    });

    // === 확인 문구 박스 ===
    tableY -= 5;
    const confirmBoxHeight = 50;
    this.page.drawRectangle({
      x: margin,
      y: tableY - confirmBoxHeight,
      width: contentWidth,
      height: confirmBoxHeight,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderWidth: 0.5,
      color: rgb(0.98, 0.98, 0.98),
    });
    const confirmText = '위와 같이 사직서를 제출합니다.';
    const confirmWidth = this.font.widthOfTextAtSize(confirmText, 11);
    this.page.drawText(confirmText, {
      x: (pageWidth - confirmWidth) / 2,
      y: tableY - confirmBoxHeight / 2 - 4,
      size: 11,
      font: this.font,
      color: rgb(0.15, 0.15, 0.15),
    });
    tableY -= confirmBoxHeight + 25;

    // === 서명란 ===
    this.page.drawText('작 성 일 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 150, 22, 'sign_date');
    tableY -= 30;

    this.page.drawText('작 성 자 :', { x: pageWidth / 2 - 120, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });
    this.drawTableInputCell(pageWidth / 2 - 65, tableY - 5, 100, 22, 'sign_name');
    this.page.drawText('(인)', { x: pageWidth / 2 + 50, y: tableY, size: 10, font: this.font, color: rgb(0.2, 0.2, 0.2) });

    tableY -= 40;

    // 수신인 (회사)
    const ceoCompanyName = companyInfo?.name || '주식회사 ○○○○';
    this.page.drawText(`${ceoCompanyName} 대표이사 귀하`, {
      x: pageWidth / 2 - 80,
      y: tableY,
      size: 11,
      font: this.font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // 회사 푸터
    this.drawFooter();

    return this.pdfDoc.save();
  }
}

// 템플릿 타입에 따른 PDF 생성 함수
export async function generatePDF(templateType: string, companyInfo?: CompanyInfo): Promise<Uint8Array> {
  const generator = new PDFGenerator();

  switch (templateType) {
    case 'resume':
      return generator.generateResume(companyInfo);
    case 'coverLetter':
      return generator.generateCoverLetter(companyInfo);
    case 'pledge':
      return generator.generatePledge(companyInfo);
    case 'statement':
      return generator.generateStatement(companyInfo);
    case 'apology':
      return generator.generateApology(companyInfo);
    case 'consent':
      return generator.generateConsent(companyInfo);
    case 'testimony':
      return generator.generateTestimony(companyInfo);
    case 'meetingMinutes':
      return generator.generateMeetingMinutes(companyInfo);
    case 'disciplineNotice':
      return generator.generateDisciplineNotice(companyInfo);
    case 'explanation':
      return generator.generateExplanation(companyInfo);
    case 'resignation':
      return generator.generateResignation(companyInfo);
    default:
      throw new Error(`Unknown template type: ${templateType}`);
  }
}

// 회사 정보와 함께 PDF 생성 (generatePDF의 별칭)
export const generatePDFWithCompany = generatePDF;

// PDF 다운로드 헬퍼 함수
export function downloadPDF(pdfBytes: Uint8Array, fileName: string) {
  const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
