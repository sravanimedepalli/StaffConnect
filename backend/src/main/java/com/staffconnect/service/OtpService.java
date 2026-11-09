package com.staffconnect.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private static final SecureRandom secureRandom = new SecureRandom();

    @Value("${sms.provider:mock}")
    private String smsProvider; // 'mock', 'twilio', 'msg91'

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.from-number:}")
    private String twilioFromNumber;

    @Value("${msg91.auth-key:}")
    private String msg91AuthKey;

    @Value("${msg91.template-id:}")
    private String msg91TemplateId;

    private final RestTemplate restTemplate = new RestTemplate();

    // In-memory OTP storage: phone -> OtpRecord
    private final Map<String, OtpRecord> otpStore = new ConcurrentHashMap<>();

    private static class OtpRecord {
        final String otp;
        final LocalDateTime expiry;

        OtpRecord(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }

        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiry);
        }
    }

    /**
     * Sends a 6-digit OTP to the specified phone number.
     */
    public Map<String, Object> sendOtp(String rawPhone) {
        String cleanPhone = normalizePhone(rawPhone);
        if (cleanPhone.length() < 7) {
            throw new IllegalArgumentException("Invalid phone number format.");
        }

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        // Expire in 5 minutes
        otpStore.put(cleanPhone, new OtpRecord(otp, LocalDateTime.now().plusMinutes(5)));

        Map<String, Object> result = new HashMap<>();

        if ("twilio".equalsIgnoreCase(smsProvider) && !twilioAccountSid.isBlank() && !twilioAuthToken.isBlank()) {
            boolean sent = dispatchTwilioSms(cleanPhone, otp);
            result.put("success", sent);
            result.put("message", sent ? "OTP sent to " + cleanPhone + " via Twilio SMS." : "Failed to send SMS via Twilio.");
        } else if ("msg91".equalsIgnoreCase(smsProvider) && !msg91AuthKey.isBlank()) {
            boolean sent = dispatchMsg91Sms(cleanPhone, otp);
            result.put("success", sent);
            result.put("message", sent ? "OTP sent to " + cleanPhone + " via MSG91." : "Failed to send SMS via MSG91.");
        } else {
            // Simulated Mock mode
            logger.info("=================================================");
            logger.info("=== [SMS OTP SIMULATOR] Destination: {}", cleanPhone);
            logger.info("=== Your Verification Code: {}", otp);
            logger.info("=== Valid for 5 minutes.");
            logger.info("=================================================");
            result.put("success", true);
            result.put("message", "OTP generated (Mock Mode: " + otp + "). Sent to " + cleanPhone);
            result.put("devOtp", otp);
        }

        return result;
    }

    /**
     * Verifies the submitted OTP against stored value.
     */
    public boolean verifyOtp(String rawPhone, String enteredOtp) {
        String cleanPhone = normalizePhone(rawPhone);
        OtpRecord record = otpStore.get(cleanPhone);

        if (record == null) {
            logger.warn("No OTP record found for phone: {}", cleanPhone);
            return false;
        }

        if (record.isExpired()) {
            otpStore.remove(cleanPhone);
            logger.warn("OTP has expired for phone: {}", cleanPhone);
            return false;
        }

        if (record.otp.trim().equals(enteredOtp.trim())) {
            otpStore.remove(cleanPhone);
            logger.info("Phone verification successful for: {}", cleanPhone);
            return true;
        }

        return false;
    }

    private boolean dispatchTwilioSms(String toPhone, String otp) {
        try {
            String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", twilioAccountSid);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String auth = twilioAccountSid + ":" + twilioAuthToken;
            headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString(auth.getBytes()));

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("To", toPhone);
            body.add("From", twilioFromNumber);
            body.add("Body", "Your StaffConnect verification code is: " + otp + ". Valid for 5 minutes.");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Twilio SMS dispatch failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean dispatchMsg91Sms(String toPhone, String otp) {
        try {
            String url = String.format("https://control.msg91.com/api/v5/otp?template_id=%s&mobile=%s&authkey=%s&otp=%s",
                    msg91TemplateId, toPhone, msg91AuthKey, otp);
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("MSG91 SMS dispatch failed: {}", e.getMessage());
            return false;
        }
    }

    public static String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9+]", "").trim();
    }
}
