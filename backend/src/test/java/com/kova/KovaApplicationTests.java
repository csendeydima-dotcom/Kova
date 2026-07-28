package com.kova;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class KovaApplicationTests {
    @Autowired MockMvc mvc;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void workspaceRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/workspace")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsCrossOriginMutation() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .header("Origin", "https://attacker.example")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void allowsSameOriginMutationToReachValidation() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .header("Origin", "http://localhost")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
