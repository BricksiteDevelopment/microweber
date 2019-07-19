<?php
function get_mail_template_types() {
	
	$email_template_types = array();
	
	$default_mail_templates = normalize_path(MW_PATH  . 'Views/emails');
	$default_mail_templates = scandir($default_mail_templates);
	
	foreach ($default_mail_templates as $template_file) {
		if (strpos($template_file, "blade.php") !== false) {
			
			$template_type = str_replace('.blade.php', false, $template_file);
			
			$email_template_types[] = $template_type;
		}
	}
	
	return $email_template_types;
}

function get_mail_template_fields($type = '') {
	
	if ($type == 'new_order' || $type == 'order_change_status' || $type == 'receive_payment') {
		
		$fields= array();
		$fields[] = array('tag'=>'{id}', 'name'=> 'Order Id');
		$fields[] = array('tag'=>'{date}', 'name'=> 'Date');
		$fields[] = array('tag'=>'{cart_items}', 'name'=> 'Cart items');
		$fields[] = array('tag'=>'{amount}', 'name'=> 'Amount');
		$fields[] = array('tag'=>'{order_status}', 'name'=> 'Order Status');
		$fields[] = array('tag'=>'{currency}', 'name'=> 'Currency');
		$fields[] = array('tag'=>'{first_name}', 'name'=> 'First Name');
		$fields[] = array('tag'=>'{last_name}', 'name'=> 'Last Name');
		$fields[] = array('tag'=>'{email}', 'name'=> 'Email');
		$fields[] = array('tag'=>'{country}', 'name'=> 'Country');
		$fields[] = array('tag'=>'{city}', 'name'=> 'City');
		$fields[] = array('tag'=>'{state}', 'name'=> 'State');
		$fields[] = array('tag'=>'{zip}', 'name'=> 'Zip');
		$fields[] = array('tag'=>'{address}', 'name'=> 'Address');
		$fields[] = array('tag'=>'{phone}', 'name'=> 'Phone');
		$fields[] = array('tag'=>'{transaction_id}', 'name'=> 'Transaction Id');
		$fields[] = array('tag'=>'{order_id}', 'name'=> 'Order Id');
			
		return $fields;
	}
	
	if ($type == 'new_comment') {
		
		$fields= array();
		$fields[] = array('tag'=>'{id}', 'name'=> 'Comment Id');
		$fields[] = array('tag'=>'{date}', 'name'=> 'Date');
		$fields[] = array('tag'=>'{first_name}', 'name'=> 'First Name');
		$fields[] = array('tag'=>'{last_name}', 'name'=> 'Last Name');
		$fields[] = array('tag'=>'{email}', 'name'=> 'Email');
		
		return $fields;
	}
}

api_expose('save_mail_template');
function save_mail_template($data)
{
	if (! is_admin()) {
		return;
	}
	$table = "mail_templates";
	return db_save($table, $data);
}

function get_mail_template_by_id($id) {
	
	foreach (get_mail_templates() as $template) {
		
		if ($template['id'] == $id) {
			
			if (isset($template['is_default'])) {
				$template['message'] = file_get_contents(normalize_path(MW_PATH  . 'Views/emails') . $template['id']);
			}
			
			return $template;
		}
	}
	
}

function get_mail_templates($params = array())
{
	if (is_string($params)) {
		$params = parse_params($params);
	}
	
	$params['table'] = "mail_templates";
	$templates =  db_get($params);
	
	$typesMap = array();
	if (!empty($templates)) {
		foreach ($templates as $template) {
			$typesMap[] = $template['type'];
		}
	}
	
	$default_mail_templates = normalize_path(MW_PATH  . 'Views/emails');
	$default_mail_templates = scandir($default_mail_templates);
	
	foreach ($default_mail_templates as $template_file) {
		if (strpos($template_file, "blade.php") !== false) {
			
			$template_type = str_replace('.blade.php', false, $template_file);
			$template_name = str_replace('_', ' ', $template_type);
			$template_name = ucfirst($template_name);
			
			if (in_array($template_type, $typesMap)) {
				continue;
			}
			
			$templates[] = array(
				'id'=> $template_file,
				'type' => $template_type,
				'name' => $template_name,
				'subject'=>$template_name,
				'from_name'=> get_option('email_from_name','email'),
				'from_email'=> get_option('email_from','email'),
				'copy_to'=>'',
				'message'=> '',
				'is_default' => true,
				'is_active' => 1
			);
		}
	}
	
	return $templates;
}

api_expose('delete_mail_template');
function delete_mail_template($params)
{
	if (! is_admin()) {
		return;
	}
	if (isset($params['id'])) {
		$table = "mail_templates";
		$id = $params['id'];
		return db_delete($table, $id);
	}
}