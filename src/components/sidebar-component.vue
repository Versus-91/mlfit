<template>
    <div class="column is-3">
        <upload-component></upload-component>
        Side bar
    </div>
</template>

<script>
import UploadComponent from "./upload-component.vue";

export default {
    name: 'SidebarComponent',
    components: {
        UploadComponent
    },
    props: {
        msg: String
    }
}
</script>

<style></style>