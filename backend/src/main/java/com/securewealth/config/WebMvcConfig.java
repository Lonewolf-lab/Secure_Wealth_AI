package com.securewealth.config;

import com.securewealth.middleware.WealthActionInterceptor;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final WealthActionInterceptor wealthActionInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(wealthActionInterceptor)
                .addPathPatterns("/api/actions/**", "/api/investments/**"); // Protect critical endpoints
    }
    
    // Simple filter to wrap request for caching body
    @Configuration
    public static class RequestCachingFilter implements Filter {
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) 
                throws IOException, ServletException {
            HttpServletRequest req = (HttpServletRequest) request;
            ContentCachingRequestWrapper wrapper = new ContentCachingRequestWrapper(req);
            
            // Need to read the body at least once so it gets cached before the interceptor hits
            // For simple implementation, interceptor will do best-effort to parse it without fully consuming
            
            chain.doFilter(wrapper, response);
        }
    }
}
