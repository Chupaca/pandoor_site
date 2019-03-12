'use strict'


function saveNewPage() {
    let prefixLanguage = $("#language_select option:selected").val() != 'he' ? $("#language_select option:selected").val() + '_' : '';
    let architectsContact = { Accordion: [] };
    architectsContact.MetaData = GetMetaData();
    architectsContact.Header = GetHeaderData();
    architectsContact.Content = GetSimpleContent()
    architectsContact.Language = $("#language_select option:selected").val() || 0;

    architectsContact.Accordion = Array.from($(".accordion_row")).map(item => {
        return {
            AccordionTitle: $(item).find("input").val(),
            AccordionDescription: $(item).next().find(".original_html_text").html()
        }
    })

    architectsContact.StaticsBlocks = {};
    let flagStatics = GetStaticsFieldsBlocks(architectsContact.StaticsBlocks);

    if (architectsContact.MetaData && architectsContact.Header && architectsContact.Content && architectsContact.Language && flagStatics) {
        ConformModal("האם אתה רוצה לשמור גרסה חדשה?", () => {
            SaveNewPageToServer(architectsContact, prefixLanguage + "architectscontact");
        })
    } else {
        if (!architectsContact.Language) {
            Flash('נא לבחור שפה!', 'warning');
        } else {
            Flash('לא כל השדות מלאים!', 'warning');
        }
        return;
    }
}


function publishPage() {
    let data = [];
    let prefixLanguage = $("#language_select_preview option:selected").val();
    $("#sortable li").each((i, item) => {
        data.push(
            {
                Position: Number($(item).find(".page_item_position").text()),
                Id: $(item).attr("data-id")
            }
        )
    })
    if (data && data.length == 1) {
        ConformModal("האם אתה רוצה לפרסם גרסה ?", () => {
            SetActiveSinglePage(data[0].Id, prefixLanguage)
        })
    } else {
        Flash("אי אפשר לשמור ללא דף ולא יותר מ-1", "warning")
    }
}

function SetFieldsTemplate(template) {
    SetEmptyBlocks()
    $(".meta_data_table tbody").html(BuildMetaRow(template.MetaData));
    $(".remove_row_meta").unbind().click(removeMetaRow);
    GetImagePreviewFormattingTemplate([template.Header.ImageId], [template.Header.LinkToBucket], "headers");
    $(".wrap_header_page .title_header").val(template.Header.Title);
    $(".remove_text").trigger("click")
    $(".wrap_header_page .original_html_text").html(template.Header.SubTitleHtml);
    GetImagePreviewFormattingTemplate(template.Content.ContentImages.map(item => item.ImageId), template.Content.ContentImages.map(item => item.LinkToBucket), "generals");
    $(".wrap_content_page .original_html_text").html(template.Content.ContentHtml);
    $(".switch_wraps[data-wrap='metadata']").trigger("click");
    $(".accordion_container").html(BuildAccordion(template.Accordion))
    accordionEvents(false)
    SetStaticsFieldsBlocks(template)
}


function sortAndPreviewSelectedItemsByLanguage() {
    $.get(`/admin/versionsbylanguage/${$(this).val()}/${$(this).attr('data-type')}`)
        .then(html => {
            $("#vertion_wrap").html(html)
            $("#template_page").unbind().click(getTemplatePage);
            $("#publish_page").unbind().click(publishPage);
            $("#sortable, #sortable_tmp").sortable({
                connectWith: ".connectedSortable",
                stop: () => { sortNavItemsAfterChange() }
            }).disableSelection();
            sortNavItemsAfterChange()
            insertDataToRowItemVersion(["Header", "Title"])
            mouseOverRowVersion()
            $(".remove_page").unbind().click(removePage)
            $(".page_item").unbind().click(markVersionPage);
        })
}