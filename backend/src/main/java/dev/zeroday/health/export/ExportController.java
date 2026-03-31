package dev.zeroday.health.export;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class ExportController {

    private final PdfExportService pdfExportService;

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestBody ExportRequest request) {
        byte[] pdf = pdfExportService.generatePdf(request.getSections(),
                request.getFrom() != null ? request.getFrom() : LocalDate.now().minusMonths(3),
                request.getTo() != null ? request.getTo() : LocalDate.now());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=health-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @lombok.Data
    public static class ExportRequest {
        private List<String> sections;
        private LocalDate from;
        private LocalDate to;
    }
}
