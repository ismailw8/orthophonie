package com.orthophoniste.suivi.dto;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private int seancesEffectuees;
    private int seancesPrevues;
    private int progressionGlobale;
    private BilanResponse bilan;
    private List<SeanceResponse> prochainesSeances;
    private List<SeanceResponse> seancesPassees;
}