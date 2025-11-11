<template>
    <div class="container my-5">
        Refresh
    </div>

</template>

<script lang="ts">
import { defineComponent } from "vue";
import { BRadio } from "buefy";

export default defineComponent({
    components: {
        BRadio,
    },
    data() {
        return {
            radio: "Jack",
        };
    },
});
</script>