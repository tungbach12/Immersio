package com.immersio.scenarios.api.dto; import java.util.*; public record StartSessionResponse(UUID sessionId,String initialMessage,ScenarioDto scenario,List<SessionMessageDto> messages){}
