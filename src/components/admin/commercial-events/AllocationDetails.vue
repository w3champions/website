<template>
  <v-sheet rounded="lg" border class="pa-3">
    <v-progress-linear v-if="details?.loading" indeterminate color="primary" class="mb-2" />
    <v-alert v-if="details?.error" type="error" variant="tonal" density="compact" class="mb-2">
      {{ details.error }}
      <template v-slot:append>
        <v-btn variant="text" size="small" @click="store.loadDetails(allocationId)">Retry</v-btn>
      </template>
    </v-alert>

    <div class="text-subtitle-2">Usage per period</div>
    <v-table density="compact">
      <thead>
        <tr>
          <th>Period</th>
          <th>Used</th>
          <th>Counted</th>
          <th>In progress</th>
          <th>Not counted</th>
          <th>Available</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="period in details?.periods ?? []" :key="period.periodId">
          <td>{{ periodRangeLabel(period) }}</td>
          <td>{{ period.used }}</td>
          <td>{{ period.consumed }}</td>
          <td>{{ period.held }}</td>
          <td>{{ period.invalid }}</td>
          <td>{{ period.available }}</td>
          <td>{{ period.size }}</td>
        </tr>
        <tr v-if="details && !details.loading && details.periods.length === 0">
          <td colspan="7" class="text-medium-emphasis">No periods yet.</td>
        </tr>
      </tbody>
    </v-table>
    <div class="text-caption text-medium-emphasis mb-3">
      Size is the allocation's current games per period, shown for every period.
    </div>

    <div class="text-subtitle-2">Events</div>
    <v-table density="compact">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Status</th>
          <th>Used / limit</th>
          <th>Not counted</th>
          <th>Start</th>
          <th>End</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in details?.events ?? []" :key="event.id">
          <td>{{ event.id }}</td>
          <td>{{ event.name }}</td>
          <td>
            <v-chip size="small" variant="flat" :color="eventStatusColor(event)">{{ eventStatusLabel(event) }}</v-chip>
          </td>
          <td>{{ eventUsedLabel(event) }}</td>
          <td>{{ event.invalid }}</td>
          <td>{{ formatUtc(event.startsAt) }}</td>
          <td>{{ formatUtc(event.endsAt) }}</td>
        </tr>
        <tr v-if="details && !details.loading && details.events.length === 0">
          <td colspan="7" class="text-medium-emphasis">No events on this allocation.</td>
        </tr>
      </tbody>
    </v-table>
  </v-sheet>
</template>

<script lang="ts" setup>
import { computed, onMounted } from "vue";
import { useCommercialEventAllocationsStore } from "@/store/admin/commercialEvents/allocationsStore";
import type { AllocationRowDetails } from "@/store/admin/commercialEvents/allocationsStore";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { eventStatusColor, eventStatusLabel, eventUsedLabel, periodRangeLabel } from "@/store/admin/commercialEvents/format";

const props = defineProps<{ allocationId: string }>();

const store = useCommercialEventAllocationsStore();
const details = computed<AllocationRowDetails | undefined>(() => store.details[props.allocationId]);

onMounted(() => store.loadDetails(props.allocationId));
</script>
