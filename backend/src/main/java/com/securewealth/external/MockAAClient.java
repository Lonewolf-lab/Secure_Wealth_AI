package com.securewealth.external;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.securewealth.model.Transaction;
import com.securewealth.model.User;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
@RequiredArgsConstructor
public class MockAAClient {

    private final ObjectMapper objectMapper;
    private JsonNode customersData;
    private List<Transaction> allTransactions;

    @PostConstruct
    public void init() {
        try {
            objectMapper.registerModule(new JavaTimeModule());
            
            InputStream customersStream = new ClassPathResource("mock-data/customers.json").getInputStream();
            customersData = objectMapper.readTree(customersStream);

            InputStream transactionsStream = new ClassPathResource("mock-data/transactions.json").getInputStream();
            allTransactions = objectMapper.readValue(transactionsStream, new TypeReference<List<Transaction>>(){});
            log.info("Loaded mock AA data on startup");
        } catch (Exception e) {
            log.error("Failed to load mock AA data", e);
        }
    }

    public JsonNode getCustomerProfile(Long userId) {
        if (customersData != null && customersData.isArray()) {
            for (JsonNode customer : customersData) {
                if (customer.get("userId").asLong() == userId) {
                    return customer;
                }
            }
        }
        return null;
    }

    public List<Transaction> getTransactions(Long userId, int months) {
        if (allTransactions == null) return new ArrayList<>();
        // In a real app, we would filter by months. For mock, just return user's transactions.
        return allTransactions.stream()
                .filter(t -> userId.equals(t.getUser() != null ? t.getUser().getId() : getUserIdFromMock(t)))
                .collect(Collectors.toList());
    }

    private Long getUserIdFromMock(Transaction t) {
        // Fallback if Transaction JSON mapping directly mapped a "userId" field instead of full User object
        try {
            var field = t.getClass().getDeclaredField("userId");
            field.setAccessible(true);
            return (Long) field.get(t);
        } catch (Exception e) {
             // Since Jackson might not map plain userId to User object automatically without custom desc,
             // let's rely on standard logic where we check the actual json if needed or keep it simple.
        }
        return 1L; // Defaults to 1 for demo fallback if object mapping didn't handle it
    }
}
